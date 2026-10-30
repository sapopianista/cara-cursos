package br.com.caracursos.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import br.com.caracursos.model.CursoResumo;

/** Aulas de um curso e o progresso do aluno em cada uma (tabelas {@code aulas} e {@code progresso_aulas}). */
public class AulaDAO {

    /** Formato {@code Aula} do contrato. {@code status}: concluida | em_andamento | pendente. */
    public record Aula(int id, int ordem, String titulo, String tipo, int duracaoSegundos, int posicaoSegundos,
                       String status, String videoUrl, String posterUrl, String legendaUrl) {
    }

    /** Aula em andamento mais recente do aluno ("Continuar de onde parei"). */
    public record Continuacao(CursoResumo curso, Aula aula, String tema, String imagemUrl) {
    }

    private static final String SELECT = "SELECT a.id, a.ordem, a.titulo, a.tipo, a.duracao_segundos, a.video_url, "
            + "a.poster_url, a.legenda_url, COALESCE(p.posicao_segundos, 0) AS posicao, "
            + "COALESCE(p.status, 'pendente') AS status "
            + "FROM aulas a LEFT JOIN progresso_aulas p ON p.id_aula = a.id AND p.id_usuario = ? ";

    private final Connection conexao;

    public AulaDAO(Connection conexao) {
        this.conexao = conexao;
    }

    public List<Aula> listar(int idCurso, int idUsuario) throws SQLException {
        List<Aula> lista = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement(SELECT + "WHERE a.id_curso = ? ORDER BY a.ordem")) {
            Jdbc.preencher(ps, idUsuario, idCurso);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) lista.add(mapear(rs));
            }
        }
        return lista;
    }

    /** A aula, se pertence ao curso; senão {@code null}. */
    public Aula buscar(int idCurso, int idAula, int idUsuario) throws SQLException {
        try (PreparedStatement ps = conexao.prepareStatement(SELECT + "WHERE a.id_curso = ? AND a.id = ?")) {
            Jdbc.preencher(ps, idUsuario, idCurso, idAula);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapear(rs) : null;
            }
        }
    }

    /** Guarda onde o aluno parou. Uma aula já concluída continua concluída. */
    public void salvarPosicao(int idUsuario, int idAula, int posicaoSegundos, Instant quando) throws SQLException {
        String sql = "INSERT INTO progresso_aulas (id_usuario, id_aula, posicao_segundos, status, atualizado_em) "
                + "VALUES (?, ?, ?, 'em_andamento', ?) AS novo "
                + "ON DUPLICATE KEY UPDATE posicao_segundos = novo.posicao_segundos, "
                + "atualizado_em = novo.atualizado_em";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, idUsuario, idAula, posicaoSegundos, quando);
            ps.executeUpdate();
        }
    }

    public void concluir(int idUsuario, int idAula, int duracaoSegundos, Instant quando) throws SQLException {
        String sql = "INSERT INTO progresso_aulas (id_usuario, id_aula, posicao_segundos, status, atualizado_em, concluida_em) "
                + "VALUES (?, ?, ?, 'concluida', ?, ?) AS novo "
                + "ON DUPLICATE KEY UPDATE status = 'concluida', posicao_segundos = novo.posicao_segundos, "
                + "atualizado_em = novo.atualizado_em, "
                + "concluida_em = COALESCE(progresso_aulas.concluida_em, novo.concluida_em)";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, idUsuario, idAula, duracaoSegundos, quando, quando);
            ps.executeUpdate();
        }
    }

    /** Porcentagem (0–100) de aulas do curso concluídas pelo aluno. */
    public int progressoDoCurso(int idUsuario, int idCurso) throws SQLException {
        String sql = "SELECT COUNT(*) AS total, COALESCE(SUM(p.status = 'concluida'), 0) AS concluidas "
                + "FROM aulas a LEFT JOIN progresso_aulas p ON p.id_aula = a.id AND p.id_usuario = ? "
                + "WHERE a.id_curso = ?";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, idUsuario, idCurso);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                int total = rs.getInt("total");
                return total == 0 ? 0 : (int) Math.round(rs.getInt("concluidas") * 100.0 / total);
            }
        }
    }

    public Continuacao continuar(int idUsuario) throws SQLException {
        String sql = "SELECT a.id, a.ordem, a.titulo, a.tipo, a.duracao_segundos, a.video_url, a.poster_url, "
                + "a.legenda_url, p.posicao_segundos AS posicao, p.status, "
                + "c.id AS curso_id, c.titulo AS curso_titulo, cat.nome AS categoria, c.tema, c.imagem_url "
                + "FROM progresso_aulas p JOIN aulas a ON a.id = p.id_aula JOIN cursos c ON c.id = a.id_curso "
                + "JOIN categorias cat ON cat.id = c.id_categoria "
                + "WHERE p.id_usuario = ? AND p.status = 'em_andamento' ORDER BY p.atualizado_em DESC LIMIT 1";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, idUsuario);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                CursoResumo curso = new CursoResumo(rs.getInt("curso_id"), rs.getString("curso_titulo"),
                        rs.getString("categoria"));
                return new Continuacao(curso, mapear(rs), rs.getString("tema"), rs.getString("imagem_url"));
            }
        }
    }

    /**
     * Minutos de estudo desde {@code desde}: a duração das aulas concluídas no período
     * mais o trecho assistido das que estão em andamento.
     */
    public int minutosEstudadosDesde(int idUsuario, Instant desde) throws SQLException {
        String sql = "SELECT COALESCE(SUM(CASE WHEN p.status = 'concluida' THEN a.duracao_segundos "
                + "ELSE p.posicao_segundos END), 0) "
                + "FROM progresso_aulas p JOIN aulas a ON a.id = p.id_aula "
                + "WHERE p.id_usuario = ? AND p.atualizado_em >= ?";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, idUsuario, desde);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return (int) Math.round(rs.getLong(1) / 60.0);
            }
        }
    }

    private static Aula mapear(ResultSet rs) throws SQLException {
        return new Aula(rs.getInt("id"), rs.getInt("ordem"), rs.getString("titulo"), rs.getString("tipo"),
                rs.getInt("duracao_segundos"), rs.getInt("posicao"), rs.getString("status"),
                rs.getString("video_url"), rs.getString("poster_url"), rs.getString("legenda_url"));
    }
}
