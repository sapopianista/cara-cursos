package br.com.caracursos.service;

import java.sql.Connection;
import java.sql.SQLException;

/** Executa blocos de serviço dentro de uma transação JDBC preservando a exceção original. */
final class Transacao {

    @FunctionalInterface
    interface Bloco<T> {
        T executar(Connection c) throws SQLException;
    }

    private Transacao() {
    }

    static <T> T executar(Connection c, Bloco<T> bloco) throws SQLException {
        c.setAutoCommit(false);
        Throwable falha = null;
        try {
            T resultado = bloco.executar(c);
            c.commit();
            return resultado;
        } catch (Throwable e) {
            falha = e;
            try {
                c.rollback();
            } catch (SQLException sup) {
                e.addSuppressed(sup);
            }
            if (e instanceof SQLException sqlEx) throw sqlEx;
            if (e instanceof RuntimeException rtEx) throw rtEx;
            if (e instanceof Error err) throw err;
            throw new SQLException(e);
        } finally {
            try {
                c.setAutoCommit(true);
            } catch (SQLException sup) {
                if (falha != null) falha.addSuppressed(sup);
                else throw sup;
            }
        }
    }
}
