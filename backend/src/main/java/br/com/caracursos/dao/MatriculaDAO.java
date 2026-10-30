package br.com.caracursos.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import br.com.caracursos.model.CursoResumo;
import br.com.caracursos.model.Matricula;

/** Acesso à tabela {@code matriculas}. */
public class MatriculaDAO {

    /** Curso de uma matrícula com o progresso, para o painel do gestor. */
    public record CursoDoAluno(CursoResumo curso, int progresso, Instant dataConclusao) {
    }

    private final Connection conexao;

    public MatriculaDAO(Connection conexao) {
        this.conexao = conexao;
    }

    public Matricula buscar(int idUsuario, int idCurso) throws SQLException {
        String sql = "SELECT id, id_usuario, id_curso, progresso, data_matricula, data_conclusao "
                + "FROM matriculas WHERE id_usuario = ? AND id_curso = ?";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, idUsuario, idCurso);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                return new Matricula(rs.getInt("id"), rs.getInt("id_usuario"), rs.getInt("id_curso"),
                        rs.getInt("progresso"), Jdbc.instante(rs, "data_matricula"),
                        Jdbc.instante(rs, "data_conclusao"));
            }
        }
    }

    /** Matricula o usuário no curso, se ainda não estiver (o aluno se matricula ao começar a primeira aula). */
    public void garantir(int idUsuario, int idCurso, Instant quando) throws SQLException {
        String sql = "INSERT IGNORE INTO matriculas (id_usuario, id_curso, progresso, data_matricula) VALUES (?, ?, 0, ?)";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, idUsuario, idCurso, quando);
            ps.executeUpdate();
        }
    }

    /** Grava o progresso; a data de conclusão é registrada só na primeira vez que chega a 100%. */
    public void atualizarProgresso(int idUsuario, int idCurso, int progresso, Instant quando) throws SQLException {
        String sql = "UPDATE matriculas SET progresso = ?, "
                + "data_conclusao = CASE WHEN ? >= 100 THEN COALESCE(data_conclusao, ?) ELSE NULL END "
                + "WHERE id_usuario = ? AND id_curso = ?";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, progresso, progresso, quando, idUsuario, idCurso);
            ps.executeUpdate();
        }
    }

    /** Progresso (0–100) do usuário em cada curso em que está matriculado. */
    public Map<Integer, Integer> progressoPorCurso(int idUsuario) throws SQLException {
        Map<Integer, Integer> mapa = new HashMap<>();
        String sql = "SELECT id_curso, progresso FROM matriculas WHERE id_usuario = ?";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, idUsuario);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) mapa.put(rs.getInt(1), rs.getInt(2));
            }
        }
        return mapa;
    }

    public List<CursoDoAluno> cursosDoUsuario(int idUsuario) throws SQLException {
        String sql = "SELECT c.id, c.titulo, cat.nome AS categoria, m.progresso, m.data_conclusao "
                + "FROM matriculas m JOIN cursos c ON c.id = m.id_curso "
                + "JOIN categorias cat ON cat.id = c.id_categoria "
                + "WHERE m.id_usuario = ? ORDER BY m.progresso DESC, c.titulo";
        List<CursoDoAluno> lista = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, idUsuario);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(new CursoDoAluno(
                            new CursoResumo(rs.getInt("id"), rs.getString("titulo"), rs.getString("categoria")),
                            rs.getInt("progresso"), Jdbc.instante(rs, "data_conclusao")));
                }
            }
        }
        return lista;
    }

    /**
     * Ids dos cursos mais procurados por colegas do mesmo departamento que o
     * usuário ainda não começou, do mais procurado para o menos.
     */
    public List<Integer> popularesNoDepartamento(int idUsuario, String departamento, int limite) throws SQLException {
        String sql = "SELECT m.id_curso, COUNT(*) AS alunos FROM matriculas m JOIN usuarios u ON u.id = m.id_usuario "
                + "WHERE u.departamento = ? AND u.id <> ? "
                + "AND m.id_curso NOT IN (SELECT id_curso FROM matriculas WHERE id_usuario = ?) "
                + "GROUP BY m.id_curso ORDER BY alunos DESC, m.id_curso LIMIT ?";
        List<Integer> ids = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, departamento, idUsuario, idUsuario, limite);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) ids.add(rs.getInt(1));
            }
        }
        return ids;
    }

    /** Cursos concluídos pelo usuário, do mais recente para o mais antigo. */
    public List<Integer> cursosConcluidos(int idUsuario) throws SQLException {
        String sql = "SELECT id_curso FROM matriculas WHERE id_usuario = ? AND progresso >= 100 "
                + "ORDER BY data_conclusao DESC, id_curso";
        List<Integer> ids = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, idUsuario);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) ids.add(rs.getInt(1));
            }
        }
        return ids;
    }
}
