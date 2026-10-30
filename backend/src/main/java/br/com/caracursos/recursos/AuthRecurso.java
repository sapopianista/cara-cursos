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
import br.com.caracursos.seguranca.Permissao;
import br.com.caracursos.seguranca.Senhas;
import br.com.caracursos.seguranca.Tokens;
import br.com.caracursos.util.Relogio;

/** {@code /auth}: login, sessão atual e logout. */
public class AuthRecurso {

    /** "Manter conectado" estende a sessão; sem ele, vale por um dia de trabalho. */
    private static final Duration SESSAO_LEMBRAR = Duration.ofDays(30);
    private static final Duration SESSAO_PADRAO = Duration.ofHours(12);

    public void registrar(Roteador r) {
        r.post("/auth/login", null, this::entrar);
        r.get("/auth/me", Permissao.AUTENTICADO, this::sessaoAtual);
        r.post("/auth/logout", Permissao.AUTENTICADO, this::sair);
    }

    private Object entrar(Requisicao req) throws SQLException {
        String identificador = req.texto("identificador");
        String senha = req.textoOriginal("senha");
        Map<String, String> campos = new LinkedHashMap<>();
        if (identificador == null) campos.put("identificador", "Informe seu e-mail corporativo.");
        if (senha == null || senha.isEmpty()) campos.put("senha", "Informe sua senha.");
        if (!campos.isEmpty()) throw ApiException.validacao(campos);

        Connection c = req.conexao();
        UsuarioDAO usuarios = new UsuarioDAO(c);
        Usuario usuario = usuarios.buscarPorEmail(identificador.toLowerCase(Locale.ROOT));
        // Verifica a senha mesmo quando o e-mail não existe (tempo de resposta igual).
        boolean senhaConfere = Senhas.verificar(senha, usuario == null ? null : usuario.getSenha());
        if (usuario == null || !senhaConfere) {
            throw ApiException.naoAutorizado("CREDENCIAIS_INVALIDAS", "E-mail ou senha incorretos.");
        }
        if (usuario.getStatus() == Usuario.Status.INATIVO) {
            throw ApiException.proibido("Seu acesso está desativado. Fale com o RH da sua empresa.");
        }

        boolean lembrar = Boolean.TRUE.equals(req.booleano("lembrar"));
        Instant agora = Relogio.agora();
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

    private Object sair(Requisicao req) throws SQLException {
        new SessaoDAO(req.conexao()).revogar(req.token());
        return null;
    }

    /** Formato {@code Usuario} do contrato: { id, nome, email, cargo, departamento, papel, empresa }. */
    static Map<String, Object> usuarioJson(Usuario u, Connection c) throws SQLException {
        UsuarioDAO.Empresa empresa = new UsuarioDAO(c).empresa();
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("id", u.getId());
        json.put("nome", u.getNome());
        json.put("email", u.getEmail());
        json.put("cargo", u.getCargo());
        json.put("departamento", u.getDepartamento());
        json.put("papel", u.getTipoPerfil().getValorBanco());
        json.put("empresa", empresa);
        return json;
    }
}
