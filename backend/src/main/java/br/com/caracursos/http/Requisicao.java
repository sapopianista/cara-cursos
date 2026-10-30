package br.com.caracursos.http;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;

import br.com.caracursos.dao.ConexaoFactory;
import br.com.caracursos.model.Usuario;

/**
 * Tudo o que uma rota precisa: parâmetros, corpo, usuário logado e a conexão
 * com o banco (aberta sob demanda, uma por requisição, fechada pela {@link Api}).
 */
public final class Requisicao implements AutoCloseable {

    /** Bloco executado dentro de uma transação. */
    @FunctionalInterface
    public interface Transacao<T> {
        T executar(Connection conexao) throws SQLException;
    }

    private final Map<String, String> variaveis;
    private final Map<String, String> parametros;
    private final String corpoBruto;
    private final String token;
    private Usuario usuario;
    private JsonObject corpo;
    private Connection conexao;

    Requisicao(Map<String, String> variaveis, Map<String, String> parametros, String corpoBruto, String token) {
        this.variaveis = variaveis;
        this.parametros = parametros;
        this.corpoBruto = corpoBruto;
        this.token = token;
    }

    // ---- conexão ---------------------------------------------------------

    public Connection conexao() throws SQLException {
        if (conexao == null) conexao = ConexaoFactory.getConexao();
        return conexao;
    }

    /** Executa {@code bloco} com commit no fim, ou rollback se algo lançar exceção. */
    public <T> T transacao(Transacao<T> bloco) throws SQLException {
        Connection c = conexao();
        c.setAutoCommit(false);
        try {
            T resultado = bloco.executar(c);
            c.commit();
            return resultado;
        } catch (SQLException | RuntimeException e) {
            c.rollback();
            throw e;
        } finally {
            c.setAutoCommit(true);
        }
    }

    @Override
    public void close() throws SQLException {
        if (conexao != null) conexao.close();
    }

    // ---- usuário ---------------------------------------------------------

    /** Usuário autenticado. Só existe em rotas protegidas. */
    public Usuario usuario() {
        if (usuario == null) throw new IllegalStateException("Rota pública não tem usuário autenticado");
        return usuario;
    }

    public int idUsuario() {
        return usuario().getId();
    }

    void definirUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public String token() {
        return token;
    }

    // ---- caminho e query -------------------------------------------------

    /** Variável do caminho numérica, ex.: {@code {id}} em {@code /cursos/{id}}. Não numérica = 404. */
    public int idCaminho(String nome) {
        try {
            return Integer.parseInt(variaveis.get(nome));
        } catch (NumberFormatException e) {
            throw ApiException.naoEncontrado("O conteúdo solicitado não foi encontrado.");
        }
    }

    /** Parâmetro da query sem espaços nas pontas; vazio vira {@code null}. */
    public String parametro(String nome) {
        String valor = parametros.get(nome);
        if (valor == null) return null;
        valor = valor.trim();
        return valor.isEmpty() ? null : valor;
    }

    public int parametroInt(String nome, int padrao) {
        String valor = parametro(nome);
        if (valor == null) return padrao;
        try {
            return Integer.parseInt(valor);
        } catch (NumberFormatException e) {
            return padrao;
        }
    }

    // ---- corpo JSON ------------------------------------------------------

    public JsonObject corpo() {
        if (corpo == null) corpo = Json.lerObjeto(corpoBruto);
        return corpo;
    }

    /** Campo de texto do corpo, sem espaços nas pontas; ausente ou vazio vira {@code null}. */
    public String texto(String campo) {
        JsonElement valor = corpo().get(campo);
        if (valor == null || valor.isJsonNull()) return null;
        if (!valor.isJsonPrimitive()) return null;
        String texto = valor.getAsString().trim();
        return texto.isEmpty() ? null : texto;
    }

    /** Campo de texto exatamente como veio (ex.: senha, onde espaços contam); ausente vira {@code null}. */
    public String textoOriginal(String campo) {
        JsonElement valor = corpo().get(campo);
        if (valor == null || !valor.isJsonPrimitive()) return null;
        return valor.getAsString();
    }

    /** Campo inteiro do corpo (aceita {@code 3} ou {@code "3"}); ausente ou inválido vira {@code null}. */
    public Integer inteiro(String campo) {
        JsonElement valor = corpo().get(campo);
        if (valor == null || !valor.isJsonPrimitive()) return null;
        JsonPrimitive primitivo = valor.getAsJsonPrimitive();
        try {
            if (primitivo.isNumber()) {
                double numero = primitivo.getAsDouble();
                return numero == Math.rint(numero) ? (int) numero : null;
            }
            return Integer.valueOf(primitivo.getAsString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** Número do corpo (aceita decimais); ausente ou inválido vira {@code null}. */
    public Double numero(String campo) {
        JsonElement valor = corpo().get(campo);
        if (valor == null || !valor.isJsonPrimitive()) return null;
        try {
            return valor.getAsJsonPrimitive().getAsDouble();
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public Boolean booleano(String campo) {
        JsonElement valor = corpo().get(campo);
        if (valor == null || !valor.isJsonPrimitive() || !valor.getAsJsonPrimitive().isBoolean()) return null;
        return valor.getAsBoolean();
    }
}
