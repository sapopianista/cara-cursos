package br.com.caracursos.http;

import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

import br.com.caracursos.dao.SessaoDAO;
import br.com.caracursos.model.Usuario;
import br.com.caracursos.recursos.AlunoRecurso;
import br.com.caracursos.recursos.AuthRecurso;
import br.com.caracursos.recursos.CatalogoRecurso;
import br.com.caracursos.recursos.ColaboradorRecurso;
import br.com.caracursos.recursos.ConfiguracaoRecurso;
import br.com.caracursos.recursos.DashboardRecurso;
import br.com.caracursos.recursos.FaturamentoRecurso;
import br.com.caracursos.recursos.GestorRecurso;
import br.com.caracursos.recursos.NotificacaoRecurso;
import br.com.caracursos.recursos.RelatorioRecurso;
import br.com.caracursos.recursos.SalaRecurso;
import br.com.caracursos.recursos.SuporteRecurso;
import br.com.caracursos.recursos.TrilhaRecurso;
import br.com.caracursos.seguranca.Permissao;

/**
 * Processa uma requisição do início ao fim, sem depender da API de Servlets
 * (o {@link ApiServlet} só adapta; os testes chamam {@link #processar} direto):
 * rota → autenticação → permissão → ação → resposta JSON ou arquivo.
 */
public final class Api {

    /** Requisição já extraída do HTTP. {@code caminho} é relativo a /api (ex.: "/cursos/3"). */
    public record Pedido(String metodo, String caminho, Map<String, String> parametros, String corpo,
                         String autorizacao) {
    }

    public record Resposta(int status, String tipoConteudo, byte[] corpo, Map<String, String> cabecalhos) {
        public String texto() {
            return corpo == null ? "" : new String(corpo, StandardCharsets.UTF_8);
        }
    }

    private static final Logger LOG = Logger.getLogger(Api.class.getName());
    private static final String JSON = "application/json; charset=UTF-8";

    private final Roteador roteador = new Roteador();

    public Api() {
        roteador.get("/saude", null, r -> Map.of("status", "ok"));
        new AuthRecurso().registrar(roteador);
        new CatalogoRecurso().registrar(roteador);
        new TrilhaRecurso().registrar(roteador);
        new SalaRecurso().registrar(roteador);
        new AlunoRecurso().registrar(roteador);
        new NotificacaoRecurso().registrar(roteador);
        new ColaboradorRecurso().registrar(roteador);
        new DashboardRecurso().registrar(roteador);
        new GestorRecurso().registrar(roteador);
        new SuporteRecurso().registrar(roteador);
        new ConfiguracaoRecurso().registrar(roteador);
        new RelatorioRecurso().registrar(roteador);
        new FaturamentoRecurso().registrar(roteador);
    }

    public Resposta processar(Pedido pedido) {
        if ("OPTIONS".equalsIgnoreCase(pedido.metodo())) {
            return new Resposta(204, null, null, cabecalhosCors(Map.of()));
        }
        String token = extrairToken(pedido.autorizacao());
        Roteador.Encontrada encontrada;
        try {
            encontrada = roteador.encontrar(pedido.metodo(), pedido.caminho());
        } catch (ApiException e) {
            return erro(e);
        }

        try (Requisicao requisicao = new Requisicao(encontrada.variaveis(), pedido.parametros(), pedido.corpo(), token)) {
            Permissao permissao = encontrada.rota().permissao();
            if (permissao != null) autenticar(requisicao, token, permissao, encontrada.rota());
            return sucesso(encontrada.rota().acao().executar(requisicao));
        } catch (ApiException e) {
            return erro(e);
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Erro de banco em " + pedido.metodo() + " " + pedido.caminho(), e);
            return erroInterno();
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Erro inesperado em " + pedido.metodo() + " " + pedido.caminho(), e);
            return erroInterno();
        }
    }

    /** O que quem precisa trocar a senha ainda pode fazer: ver a sessão, trocar a senha e sair. */
    private static final Set<String> LIBERADAS_ANTES_DE_TROCAR_SENHA =
            Set.of("GET /auth/me", "PUT /auth/senha", "POST /auth/logout");

    private static void autenticar(Requisicao requisicao, String token, Permissao permissao, Roteador.Rota rota)
            throws SQLException {
        if (token == null) throw ApiException.naoAutorizado("SESSAO_AUSENTE", "Entre para continuar.");
        Usuario usuario = new SessaoDAO(requisicao.conexao()).buscarUsuarioAtivo(token);
        if (usuario == null) {
            throw ApiException.naoAutorizado("SESSAO_EXPIRADA", "Sua sessão expirou. Entre novamente.");
        }
        if (!permissao.permite(usuario.getTipoPerfil())) {
            throw ApiException.proibido("Você não tem permissão para esta ação.");
        }
        if (usuario.isTrocarSenha() && !LIBERADAS_ANTES_DE_TROCAR_SENHA.contains(rota.metodo() + " " + rota.modelo())) {
            throw new ApiException(403, "TROCAR_SENHA", "Troque a senha provisória para continuar.", null);
        }
        requisicao.definirUsuario(usuario);
    }

    private static String extrairToken(String autorizacao) {
        if (autorizacao == null) return null;
        String valor = autorizacao.trim();
        if (valor.regionMatches(true, 0, "Bearer ", 0, 7)) {
            String token = valor.substring(7).trim();
            return token.isEmpty() ? null : token;
        }
        return null;
    }

    private static String origemCors() {
        String origem = System.getProperty("CORS_ORIGIN");
        if (origem == null || origem.isBlank()) origem = System.getenv("CORS_ORIGIN");
        return (origem == null || origem.isBlank()) ? "*" : origem;
    }

    private static Map<String, String> cabecalhosCors(Map<String, String> extras) {
        Map<String, String> cabecalhos = new LinkedHashMap<>();
        cabecalhos.put("Access-Control-Allow-Origin", origemCors());
        cabecalhos.put("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        cabecalhos.put("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept");
        cabecalhos.put("Access-Control-Expose-Headers", "Content-Disposition");
        cabecalhos.put("Access-Control-Max-Age", "86400");
        if (extras != null) cabecalhos.putAll(extras);
        return Map.copyOf(cabecalhos);
    }

    private static Resposta sucesso(Object resultado) {
        if (resultado == null) return new Resposta(204, null, null, cabecalhosCors(Map.of()));
        if (resultado instanceof Arquivo arquivo) {
            String nome = arquivo.nome().replace("\"", "");
            return new Resposta(200, arquivo.tipoConteudo(), arquivo.conteudo(),
                    cabecalhosCors(Map.of("Content-Disposition", "attachment; filename=\"" + nome + "\"")));
        }
        return new Resposta(200, JSON, Json.escrever(resultado).getBytes(StandardCharsets.UTF_8),
                cabecalhosCors(Map.of()));
    }

    private static Resposta erro(ApiException e) {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("mensagem", e.getMessage());
        corpo.put("codigo", e.getCodigo());
        corpo.put("campos", e.getCampos());
        return new Resposta(e.getStatus(), JSON, Json.escrever(corpo).getBytes(StandardCharsets.UTF_8),
                cabecalhosCors(Map.of()));
    }

    private static Resposta erroInterno() {
        return erro(new ApiException(500, "ERRO_INTERNO",
                "Ocorreu um erro no servidor. Tente novamente em instantes.", null));
    }
}
