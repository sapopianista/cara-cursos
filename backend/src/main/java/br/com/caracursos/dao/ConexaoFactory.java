package br.com.caracursos.dao;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Abre conexões JDBC com o MySQL.
 *
 * <p>A configuração vem, nesta ordem, de propriedades de sistema
 * ({@code -DDB_URL=...}), de variáveis de ambiente ou dos valores padrão
 * abaixo (pensados para desenvolvimento local):
 * <ul>
 *   <li>{@code DB_URL}</li>
 *   <li>{@code DB_USUARIO}</li>
 *   <li>{@code DB_SENHA}</li>
 * </ul>
 *
 * <p>Quem chama é responsável por fechar a conexão, de preferência com
 * try-with-resources:
 * <pre>
 * try (Connection conexao = ConexaoFactory.getConexao()) {
 *     ...
 * }
 * </pre>
 */
public final class ConexaoFactory {

    private static final String DRIVER = "com.mysql.cj.jdbc.Driver";

    // connectionTimeZone=UTC: as datas do banco são gravadas e lidas em UTC.
    // allowPublicKeyRetrieval/useSSL=false: apenas para o MySQL local.
    private static final String URL_PADRAO = "jdbc:mysql://localhost:3306/cara_cursos"
            + "?useUnicode=true&characterEncoding=UTF-8"
            + "&connectionTimeZone=UTC"
            + "&connectTimeout=5000"
            + "&useSSL=false&allowPublicKeyRetrieval=true";

    private static final String URL = configuracao("DB_URL", URL_PADRAO);
    private static final String USUARIO = configuracao("DB_USUARIO", "root");
    private static final String SENHA = configuracao("DB_SENHA", "");

    private static volatile boolean driverCarregado = false;

    private ConexaoFactory() {
    }

    /** Abre uma nova conexão. Feche-a sempre depois de usar. */
    public static Connection getConexao() throws SQLException {
        carregarDriver();
        return DriverManager.getConnection(URL, USUARIO, SENHA);
    }

    /**
     * No Tomcat, o registro automático do driver (JDBC 4) nem sempre funciona
     * quando o .jar está em WEB-INF/lib; carregar a classe explicitamente evita
     * o erro "No suitable driver found".
     */
    private static void carregarDriver() throws SQLException {
        if (driverCarregado) return;
        try {
            Class.forName(DRIVER);
            driverCarregado = true;
        } catch (ClassNotFoundException e) {
            throw new SQLException(
                    "Driver do MySQL não encontrado. Adicione o mysql-connector-j ao classpath.", e);
        }
    }

    private static String configuracao(String chave, String padrao) {
        String valor = System.getProperty(chave);
        if (valor == null || valor.isBlank()) valor = System.getenv(chave);
        return (valor == null || valor.isBlank()) ? padrao : valor;
    }
}
