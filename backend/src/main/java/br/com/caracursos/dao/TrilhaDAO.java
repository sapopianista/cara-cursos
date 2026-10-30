package br.com.caracursos.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import br.com.caracursos.http.Json;
import br.com.caracursos.model.Curso;

/** Trilhas (sequências de cursos) e níveis de carreira. */
public class TrilhaDAO {

    /** Formato da listagem de trilhas do contrato. */
    public record Trilha(int id, String titulo, String descricao, String nivel, String tema, List<String> competencias,
                         int totalCursos, int duracaoMinutos, int progresso, String status) {
    }

    public record Referencia(int id, String titulo) {
    }

    /** Nível de carreira com os cursos na ordem. */
    public record Nivel(int id, int ordem, String titulo, String perfil, List<String> competencias,
                        List<Integer> cursoIds) {
    }

    private static final String SELECT = "SELECT t.id, t.titulo, t.descricao, t.nivel, t.tema, t.competencias, "
            + "COUNT(tc.id_curso) AS total_cursos, COALESCE(SUM(c.carga_horaria_minutos), 0) AS duracao, "
            + "COALESCE(ROUND(AVG(COALESCE(m.progresso, 0))), 0) AS progresso "
            + "FROM trilhas t "
            + "LEFT JOIN trilha_cursos tc ON tc.id_trilha = t.id "
            + "LEFT JOIN cursos c ON c.id = tc.id_curso "
            + "LEFT JOIN matriculas m ON m.id_curso = c.id AND m.id_usuario = ? ";
    private static final String AGRUPAR = " GROUP BY t.id, t.titulo, t.descricao, t.nivel, t.tema, t.competencias";

    private final Connection conexao;

    public TrilhaDAO(Connection conexao) {
        this.conexao = conexao;
    }

    public List<Trilha> listar(int idUsuario) throws SQLException {
        return consultar(SELECT + AGRUPAR + " ORDER BY t.id", idUsuario);
    }

    public Trilha buscar(int id, int idUsuario) throws SQLException {
        List<Trilha> lista = consultar(SELECT + "WHERE t.id = ?" + AGRUPAR, idUsuario, id);
        return lista.isEmpty() ? null : lista.getFirst();
    }

    public List<Integer> cursosDaTrilha(int idTrilha) throws SQLException {
        return ids("SELECT id_curso FROM trilha_cursos WHERE id_trilha = ? ORDER BY ordem", idTrilha);
    }

    /** Primeira trilha que contém o curso (exibida na sala de aula), ou {@code null}. */
    public Referencia trilhaDoCurso(int idCurso) throws SQLException {
        String sql = "SELECT t.id, t.titulo FROM trilha_cursos tc JOIN trilhas t ON t.id = tc.id_trilha "
                + "WHERE tc.id_curso = ? ORDER BY t.id LIMIT 1";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, idCurso);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? new Referencia(rs.getInt("id"), rs.getString("titulo")) : null;
            }
        }
    }

    public List<Nivel> niveis() throws SQLException {
        List<Nivel> lista = new ArrayList<>();
        String sql = "SELECT id, ordem, titulo, perfil, competencias FROM niveis ORDER BY ordem";
        try (PreparedStatement ps = conexao.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(new Nivel(rs.getInt("id"), rs.getInt("ordem"), rs.getString("titulo"),
                        rs.getString("perfil"), Json.listaDeTexto(rs.getString("competencias")), new ArrayList<>()));
            }
        }
        for (Nivel n : lista) {
            n.cursoIds().addAll(ids("SELECT id_curso FROM nivel_cursos WHERE id_nivel = ? ORDER BY ordem", n.id()));
        }
        return lista;
    }

    private List<Integer> ids(String sql, int id) throws SQLException {
        List<Integer> lista = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, id);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) lista.add(rs.getInt(1));
            }
        }
        return lista;
    }

    private List<Trilha> consultar(String sql, Object... valores) throws SQLException {
        List<Trilha> lista = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, valores);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int progresso = rs.getInt("progresso");
                    lista.add(new Trilha(rs.getInt("id"), rs.getString("titulo"), rs.getString("descricao"),
                            rs.getString("nivel"), rs.getString("tema"),
                            Json.listaDeTexto(rs.getString("competencias")), rs.getInt("total_cursos"),
                            rs.getInt("duracao"), progresso, Curso.statusDoProgresso(progresso)));
                }
            }
        }
        return lista;
    }
}
