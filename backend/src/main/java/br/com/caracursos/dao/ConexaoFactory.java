package br.com.caracursos.dao;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.atomic.AtomicBoolean;

import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;

/**
 * Abre conexões JDBC com o MySQL usando pool de conexões:
 * <ol>
 *   <li>Em produção no Tomcat, usa o {@link DataSource} JNDI ({@code java:comp/env/jdbc/cara_cursos})
 *       configurado em {@code META-INF/context.xml} quando {@code DB_URL} não é sobrescrita;</li>
 *   <li>Em desenvolvimento/testes, mantém um pool embarcado por configuração ativa
 *       ({@code DB_URL}, {@code DB_USUARIO}, {@code DB_SENHA}).</li>
 * </ol>
 *
 * <p>Quem chama deve fechar a conexão com try-with-resources para devolvê-la ao pool:
 * <pre>
 * try (Connection conexao = ConexaoFactory.getConexao()) {
 *     ...
 * }
 * </pre>
 */
public final class ConexaoFactory {

    private static final String DRIVER = "com.mysql.cj.jdbc.Driver";
    private static final String JNDI_DATASOURCE = "java:comp/env/jdbc/cara_cursos";
    private static final int TAMANHO_POOL = 16;

    // connectionTimeZone=UTC: as datas do banco são gravadas e lidas em UTC.
    // allowPublicKeyRetrieval/useSSL=false: apenas para o MySQL local.
    private static final String URL_PADRAO = "jdbc:mysql://localhost:3306/cara_cursos"
            + "?useUnicode=true&characterEncoding=UTF-8"
            + "&connectionTimeZone=UTC"
            + "&connectTimeout=5000"
            + "&useSSL=false&allowPublicKeyRetrieval=true";

    private static final BlockingQueue<Connection> POOL = new ArrayBlockingQueue<>(TAMANHO_POOL);
    private static final Object TRAVA_CONFIG = new Object();

    private static volatile boolean driverCarregado = false;
    private static volatile boolean jndiVerificado = false;
    private static volatile DataSource jndiDataSource = null;
    private static volatile String configAtual = null;

    private ConexaoFactory() {
    }

    /** Obtém uma conexão do pool. Feche-a sempre depois de usar para devolvê-la ao pool. */
    public static Connection getConexao() throws SQLException {
        DataSource ds = dataSourceJndi();
        if (ds != null) {
            return ds.getConnection();
        }

        String url = configuracao("DB_URL", URL_PADRAO);
        String usuario = configuracao("DB_USUARIO", "root");
        String senha = configuracao("DB_SENHA", "");
        String chave = url + "\0" + usuario + "\0" + senha;

        atualizarConfiguracaoPool(chave);

        Connection fisica;
        while ((fisica = POOL.poll()) != null) {
            if (estaValida(fisica)) {
                return envolver(fisica, chave);
            }
            fecharSilencioso(fisica);
        }

        carregarDriver();
        fisica = DriverManager.getConnection(url, usuario, senha);
        return envolver(fisica, chave);
    }

    private static DataSource dataSourceJndi() {
        String urlSobrescrita = System.getProperty("DB_URL");
        if (urlSobrescrita != null && !urlSobrescrita.isBlank()) {
            return null;
        }
        if (jndiVerificado) {
            return jndiDataSource;
        }
        synchronized (TRAVA_CONFIG) {
            if (!jndiVerificado) {
                try {
                    Object encontrado = new InitialContext().lookup(JNDI_DATASOURCE);
                    if (encontrado instanceof DataSource ds) {
                        jndiDataSource = ds;
                    }
                } catch (NamingException | RuntimeException e) {
                    jndiDataSource = null;
                } finally {
                    jndiVerificado = true;
                }
            }
            return jndiDataSource;
        }
    }

    private static void atualizarConfiguracaoPool(String chave) {
        if (chave.equals(configAtual)) return;
        synchronized (TRAVA_CONFIG) {
            if (!chave.equals(configAtual)) {
                Connection antiga;
                while ((antiga = POOL.poll()) != null) {
                    fecharSilencioso(antiga);
                }
                configAtual = chave;
            }
        }
    }

    private static boolean estaValida(Connection c) {
        try {
            return !c.isClosed() && c.isValid(2);
        } catch (SQLException e) {
            return false;
        }
    }

    private static Connection envolver(Connection fisica, String chave) {
        AtomicBoolean fechada = new AtomicBoolean(false);
        return (Connection) Proxy.newProxyInstance(
                ConexaoFactory.class.getClassLoader(),
                new Class<?>[] { Connection.class },
                (proxy, metodo, args) -> {
                    String nome = metodo.getName();
                    if ("close".equals(nome) && metodo.getParameterCount() == 0) {
                        if (fechada.compareAndSet(false, true)) {
                            devolverAoPool(fisica, chave);
                        }
                        return null;
                    }
                    if ("isClosed".equals(nome) && metodo.getParameterCount() == 0) {
                        return fechada.get() || fisica.isClosed();
                    }
                    if ("equals".equals(nome) && metodo.getParameterCount() == 1) {
                        return proxy == args[0];
                    }
                    if ("hashCode".equals(nome) && metodo.getParameterCount() == 0) {
                        return System.identityHashCode(proxy);
                    }
                    if ("toString".equals(nome) && metodo.getParameterCount() == 0) {
                        return "PooledConnection(" + fisica + ")";
                    }
                    if (fechada.get()) {
                        throw new SQLException("Conexão já devolvida ao pool.");
                    }
                    try {
                        return metodo.invoke(fisica, args);
                    } catch (InvocationTargetException e) {
                        throw e.getCause();
                    }
                });
    }

    private static void devolverAoPool(Connection fisica, String chave) {
        try {
            if (!chave.equals(configAtual) || fisica.isClosed()) {
                fecharSilencioso(fisica);
                return;
            }
            if (!fisica.getAutoCommit()) {
                fisica.setAutoCommit(true);
            }
            fisica.clearWarnings();
            if (!POOL.offer(fisica)) {
                fecharSilencioso(fisica);
            }
        } catch (SQLException e) {
            fecharSilencioso(fisica);
        }
    }

    private static void fecharSilencioso(Connection c) {
        try {
            c.close();
        } catch (SQLException ignored) {
        }
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
