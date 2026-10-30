package br.com.caracursos;

import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Base de dados dos testes de integração.
 *
 * <p>Só roda com {@code -DDB_TESTE_URL=jdbc:mysql://host:porta/} (sem nome de base);
 * sem ela, os testes de integração são ignorados. O script {@code sql/cara_cursos.sql}
 * é aplicado numa base separada, {@code cara_cursos_teste}, recriada a cada classe de
 * teste: a base de desenvolvimento {@code cara_cursos} nunca é tocada.
 */
public final class BancoDeTeste {

    private static final String BASE = "cara_cursos_teste";
    private static final String PARAMETROS =
            "?useUnicode=true&characterEncoding=UTF-8&connectionTimeZone=UTC&allowPublicKeyRetrieval=true&useSSL=false";

    private BancoDeTeste() {
    }

    /** Recria a base de teste e aponta a ConexaoFactory para ela. */
    public static void recriar() throws IOException, SQLException {
        String servidor = System.getProperty("DB_TESTE_URL");
        assumeTrue(servidor != null && !servidor.isBlank(), "Defina -DDB_TESTE_URL para rodar os testes de integração");
        if (!servidor.endsWith("/")) servidor += "/";
        String usuario = System.getProperty("DB_TESTE_USUARIO", "root");
        String senha = System.getProperty("DB_TESTE_SENHA", "");

        String script = Files.readString(Path.of("sql", "cara_cursos.sql"), StandardCharsets.UTF_8)
                .replace("CREATE DATABASE IF NOT EXISTS cara_cursos", "DROP DATABASE IF EXISTS " + BASE
                        + ";\nCREATE DATABASE " + BASE)
                .replace("USE cara_cursos;", "USE " + BASE + ";");
        try (Connection c = DriverManager.getConnection(servidor + PARAMETROS + "&allowMultiQueries=true", usuario, senha);
             Statement st = c.createStatement()) {
            st.execute(script);
        }

        // Lidas pela ConexaoFactory na primeira vez que a classe é usada.
        System.setProperty("DB_URL", servidor + BASE + PARAMETROS);
        System.setProperty("DB_USUARIO", usuario);
        System.setProperty("DB_SENHA", senha);
    }
}
