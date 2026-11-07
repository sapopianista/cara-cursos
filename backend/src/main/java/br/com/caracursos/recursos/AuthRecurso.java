package br.com.caracursos.recursos;

import java.sql.Connection;
import java.sql.SQLException;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

import br.com.caracursos.dao.SessaoDAO;
import br.com.caracursos.dao.UsuarioDAO;
import br.com.caracursos.http.ApiException;
import br.com.caracursos.http.Requisicao;
import br.com.caracursos.http.Roteador;
import br.com.caracursos.model.Usuario;
import br.com.caracursos.seguranca.LimiteLogin;
import br.com.caracursos.seguranca.Permissao;
import br.com.caracursos.seguranca.Senhas;
import br.com.caracursos.seguranca.Tokens;
import br.com.caracursos.util.Relogio;

/** {@code /auth}: login, sessão atual e logout. */
public class AuthRecurso {

    /** "Manter conectado" estende a sessão; sem ele, vale por um dia de trabalho. */
    private static final Duration SESSAO_LEMBRAR = Duration.ofDays(30);
    private static final Duration SESSAO_PADRAO = Duration.ofHours(12);

    private final LimiteLogin limite = new LimiteLogin();

    public void registrar(Roteador r) {
        r.post("/auth/login", null, this::entrar);
        r.get("/auth/me", Permissao.AUTENTICADO, this::sessaoAtual);
        r.post("/auth/logout", Permissao.AUTENTICADO, this::sair);
        r.put("/auth/senha", Permissao.AUTENTICADO, this::trocarSenha);
    }

    private Object entrar(Requisicao req) throws SQLException {
        String identificador = req.texto("identificador");
        String senha = req.textoOriginal("senha");
        Map<String, String> campos = new LinkedHashMap<>();
        if (identificador == null) campos.put("identificador", "Informe seu e-mail corporativo.");
        if (senha == null || senha.isEmpty()) campos.put("senha", "Informe sua senha.");
        if (!campos.isEmpty()) throw ApiException.validacao(campos);

        String email = identificador.toLowerCase(Locale.ROOT);
        Instant agora = Relogio.agora();
        Duration espera = limite.bloqueio(email, agora);
        if (!espera.isZero()) {
            long minutos = Math.max(1, (espera.getSeconds() + 59) / 60);
            throw new ApiException(429, "MUITAS_TENTATIVAS", "Muitas tentativas de login. Tente novamente em "
                    + minutos + (minutos == 1 ? " minuto." : " minutos."), null);
        }

        Connection c = req.conexao();
        UsuarioDAO usuarios = new UsuarioDAO(c);
        Usuario usuario = usuarios.buscarPorEmail(email);
        // Verifica a senha mesmo quando o e-mail não existe (tempo de resposta igual).
        boolean senhaConfere = Senhas.verificar(senha, usuario == null ? null : usuario.getSenha());
        if (usuario == null || !senhaConfere) {
            limite.registrarFalha(email, agora);
            throw ApiException.naoAutorizado("CREDENCIAIS_INVALIDAS", "E-mail ou senha incorretos.");
        }
        limite.limpar(email);
        if (usuario.getStatus() == Usuario.Status.INATIVO) {
            throw ApiException.proibido("Seu acesso está desativado. Fale com o RH da sua empresa.");
        }

        // Primeiro acesso de quem foi cadastrado pelo RH.
        if (usuario.getStatus() == Usuario.Status.PENDENTE) {
            usuarios.atualizarStatus(usuario.getId(), Usuario.Status.ATIVO);
            usuario.setStatus(Usuario.Status.ATIVO);
        }

        boolean lembrar = Boolean.TRUE.equals(req.booleano("lembrar"));
        String token = Tokens.novo();
        new SessaoDAO(c).criar(token, usuario.getId(), agora, agora.plus(lembrar ? SESSAO_LEMBRAR : SESSAO_PADRAO));
        usuarios.registrarAcesso(usuario.getId(), agora);

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("token", token);
        resposta.put("usuario", usuarioJson(usuario, c));
        return resposta;
    }

    private Object sessaoAtual(Requisicao req) throws SQLException {
        Usuario u = req.usuario();
        new UsuarioDAO(req.conexao()).registrarAcesso(u.getId(), Relogio.agora());
        return usuarioJson(u, req.conexao());
    }

    /** A própria pessoa troca a senha (obrigatório depois de uma senha definida pelo RH). */
    private Object trocarSenha(Requisicao req) throws SQLException {
        Usuario u = req.usuario();
        String atual = req.textoOriginal("senhaAtual");
        String nova = req.textoOriginal("novaSenha");
        Map<String, String> campos = new LinkedHashMap<>();
        if (atual == null || atual.isEmpty()) campos.put("senhaAtual", "Informe a senha atual.");
        else if (!Senhas.verificar(atual, u.getSenha())) campos.put("senhaAtual", "Senha atual incorreta.");
        String problema = Senhas.problema(nova);
        if (problema != null) campos.put("novaSenha", problema);
        else if (nova.equals(atual)) campos.put("novaSenha", "A nova senha precisa ser diferente da atual.");
        if (!campos.isEmpty()) throw ApiException.validacao(campos);

        new UsuarioDAO(req.conexao()).definirSenha(u.getId(), Senhas.gerar(nova), false);
        u.setTrocarSenha(false);
        return usuarioJson(u, req.conexao());
    }

    private Object sair(Requisicao req) throws SQLException {
        new SessaoDAO(req.conexao()).revogar(req.token());
        return null;
    }

    /** Formato {@code Usuario} do contrato: { id, nome, email, cargo, departamento, papel, trocarSenha, empresa }. */
    static Map<String, Object> usuarioJson(Usuario u, Connection c) throws SQLException {
        UsuarioDAO.Empresa empresa = new UsuarioDAO(c).empresa();
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("id", u.getId());
        json.put("nome", u.getNome());
        json.put("email", u.getEmail());
        json.put("cargo", u.getCargo());
        json.put("departamento", u.getDepartamento());
        json.put("papel", u.getTipoPerfil().getValorBanco());
        json.put("trocarSenha", u.isTrocarSenha());
        json.put("empresa", empresa);
        return json;
    }
}
