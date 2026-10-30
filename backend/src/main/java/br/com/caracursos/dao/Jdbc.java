package br.com.caracursos.dao;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;

import br.com.caracursos.util.Relogio;

/** Conversões repetidas entre JDBC e Java. Datas no banco estão em UTC. */
final class Jdbc {

    private Jdbc() {
    }

    static Instant instante(ResultSet rs, String coluna) throws SQLException {
        Timestamp ts = rs.getTimestamp(coluna);
        return ts == null ? null : ts.toInstant();
    }

    static Timestamp timestamp(Instant instante) {
        return instante == null ? null : Timestamp.from(instante);
    }

    static Instant agora() {
        return Relogio.agora();
    }

    /** Escapa {@code %} e {@code _} para usar o texto do usuário dentro de um LIKE. */
    static String contem(String termo) {
        String escapado = termo.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + escapado + "%";
    }

    /** Preenche os parâmetros na ordem. */
    static void preencher(PreparedStatement ps, Object... valores) throws SQLException {
        for (int i = 0; i < valores.length; i++) {
            Object v = valores[i];
            if (v instanceof Instant instante) ps.setTimestamp(i + 1, timestamp(instante));
            else ps.setObject(i + 1, v);
        }
    }
}
