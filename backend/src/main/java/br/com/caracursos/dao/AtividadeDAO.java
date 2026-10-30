package br.com.caracursos.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** Atividades dos cursos e as entregas do aluno (tabelas {@code atividades} e {@code entregas}). */
public class AtividadeDAO {

    /** Formato {@code Atividade} do contrato. {@code status}: pendente | entregue. */
    public record Atividade(int id, int cursoId, String titulo, String descricao, Instant prazo, String status,
                            Instant entregueEm) {
    }

    private static final String SELECT = "SELECT t.id, t.id_curso, t.titulo, t.descricao, t.prazo, e.entregue_em "
            + "FROM atividades t LEFT JOIN entregas e ON e.id_atividade = t.id AND e.id_usuario = ? ";

    private final Connection conexao;

    public AtividadeDAO(Connection conexao) {
        this.conexao = conexao;
    }

    public List<Atividade> doCurso(int idCurso, int idUsuario) throws SQLException {
        return consultar(SELECT + "WHERE t.id_curso = ? ORDER BY t.prazo", idUsuario, idCurso);
    }

    /** Atividades ainda não entregues dos cursos em que o aluno está matriculado, por prazo. */
    public List<Atividade> pendentes(int idUsuario) throws SQLException {
        return consultar(SELECT + "JOIN matriculas m ON m.id_curso = t.id_curso AND m.id_usuario = ? "
                + "WHERE e.entregue_em IS NULL ORDER BY t.prazo", idUsuario, idUsuario);
    }

    public Atividade buscar(int id, int idUsuario) throws SQLException {
        List<Atividade> lista = consultar(SELECT + "WHERE t.id = ?", idUsuario, id);
        return lista.isEmpty() ? null : lista.getFirst();
    }

    /** Registra a entrega; entregar de novo substitui a resposta anterior. */
    public void entregar(int idAtividade, int idUsuario, String resposta, Instant quando) throws SQLException {
        String sql = "INSERT INTO entregas (id_atividade, id_usuario, resposta, entregue_em) VALUES (?, ?, ?, ?) AS novo "
                + "ON DUPLICATE KEY UPDATE resposta = novo.resposta, entregue_em = novo.entregue_em";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, idAtividade, idUsuario, resposta, quando);
            ps.executeUpdate();
        }
    }

    private List<Atividade> consultar(String sql, Object... valores) throws SQLException {
        List<Atividade> lista = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, valores);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Instant entregueEm = Jdbc.instante(rs, "entregue_em");
                    lista.add(new Atividade(rs.getInt("id"), rs.getInt("id_curso"), rs.getString("titulo"),
                            rs.getString("descricao"), Jdbc.instante(rs, "prazo"),
                            entregueEm == null ? "pendente" : "entregue", entregueEm));
                }
            }
        }
        return lista;
    }
}
