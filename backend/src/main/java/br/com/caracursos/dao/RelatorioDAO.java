package br.com.caracursos.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Relatórios do painel: histórico (tabela {@code relatorios}) e os números de cada modelo.
 * Todas as consultas ignoram colaboradores inativos e aceitam filtrar por departamento
 * ({@code null} = todos). {@code desde} é o início do período escolhido.
 */
public class RelatorioDAO {

    /** Linha do histórico, sem o arquivo. */
    public record Gerado(int id, String modelo, String periodo, String departamento, String solicitadoPor,
                         Instant criadoEm) {
    }

    public record Arquivo(String nome, byte[] conteudo) {
    }

    public record Engajamento(String matricula, String nome, String departamento, int acessos, int diasComAcesso,
                              int aulasConcluidas, Instant ultimoAcesso) {
    }

    public record ConclusaoDepartamento(String departamento, int colaboradores, int matriculas, int concluidas,
                                        int concluidasNoPeriodo, int progressoMedio) {
    }

    public record HorasDepartamento(String departamento, int colaboradores, long segundos, int certificados) {
    }

    public record AvaliacaoCurso(String curso, String categoria, String instrutor, double nota, int avaliacoes,
                                 int matriculados, int concluintesNoPeriodo) {
    }

    public record Desempenho(String nome, String departamento, int concluidos, int emAndamento, int progressoMedio,
                             int certificados, int aulasNoPeriodo, Instant ultimoAcesso) {
    }

    /** {@code progresso} nulo = não matriculado no curso. */
    public record Conformidade(String matricula, String nome, String departamento, String curso, Integer progresso,
                               Instant concluidoEm) {
    }

    private static final String ATIVOS = " u.status <> 'inativo' ";
    private static final int LIMITE_HISTORICO = 20;

    private final Connection conexao;

    public RelatorioDAO(Connection conexao) {
        this.conexao = conexao;
    }

    // ---- histórico -------------------------------------------------------

    public List<Gerado> historico() throws SQLException {
        String sql = "SELECT id, modelo, periodo, departamento, solicitado_por, criado_em FROM relatorios "
                + "ORDER BY criado_em DESC, id DESC LIMIT ?";
        return lerHistorico(sql, LIMITE_HISTORICO);
    }

    public Gerado buscar(int id) throws SQLException {
        String sql = "SELECT id, modelo, periodo, departamento, solicitado_por, criado_em FROM relatorios WHERE id = ?";
        List<Gerado> lista = lerHistorico(sql, id);
        return lista.isEmpty() ? null : lista.getFirst();
    }

    public Arquivo arquivo(int id) throws SQLException {
        try (PreparedStatement ps = conexao.prepareStatement(
                "SELECT nome_arquivo, arquivo FROM relatorios WHERE id = ?")) {
            Jdbc.preencher(ps, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? new Arquivo(rs.getString(1), rs.getBytes(2)) : null;
            }
        }
    }

    public int salvar(String modelo, String periodo, String departamento, int idSolicitante, String solicitadoPor,
                      Instant criadoEm, Arquivo arquivo) throws SQLException {
        String sql = "INSERT INTO relatorios (modelo, periodo, departamento, id_solicitante, solicitado_por, criado_em, "
                + "nome_arquivo, arquivo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conexao.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            Jdbc.preencher(ps, modelo, periodo, departamento, idSolicitante, solicitadoPor, criadoEm, arquivo.nome(),
                    arquivo.conteudo());
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }

    private List<Gerado> lerHistorico(String sql, Object... valores) throws SQLException {
        List<Gerado> lista = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, valores);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(new Gerado(rs.getInt("id"), rs.getString("modelo"), rs.getString("periodo"),
                            rs.getString("departamento"), rs.getString("solicitado_por"),
                            Jdbc.instante(rs, "criado_em")));
                }
            }
        }
        return lista;
    }

    // ---- números de cada modelo -----------------------------------------

    public List<Engajamento> engajamento(Instant desde, String departamento) throws SQLException {
        List<Object> valores = new ArrayList<>(List.of(desde, desde, desde));
        String sql = "SELECT u.matricula, u.nome, u.departamento, u.ultimo_acesso, "
                + "(SELECT COUNT(*) FROM sessoes s WHERE s.id_usuario = u.id AND s.criada_em >= ?) AS acessos, "
                + "(SELECT COUNT(DISTINCT DATE(s.criada_em)) FROM sessoes s "
                + "  WHERE s.id_usuario = u.id AND s.criada_em >= ?) AS dias, "
                + "(SELECT COUNT(*) FROM progresso_aulas pa WHERE pa.id_usuario = u.id AND pa.status = 'concluida' "
                + "  AND pa.concluida_em >= ?) AS aulas "
                + "FROM usuarios u WHERE" + ATIVOS + filtroDepartamento(departamento, valores)
                + "ORDER BY acessos DESC, u.nome";
        List<Engajamento> lista = new ArrayList<>();
        try (PreparedStatement ps = preparar(sql, valores); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(new Engajamento(rs.getString("matricula"), rs.getString("nome"), rs.getString("departamento"),
                        rs.getInt("acessos"), rs.getInt("dias"), rs.getInt("aulas"),
                        Jdbc.instante(rs, "ultimo_acesso")));
            }
        }
        return lista;
    }

    public List<ConclusaoDepartamento> conclusao(Instant desde, String departamento) throws SQLException {
        List<Object> valores = new ArrayList<>(List.of(desde));
        String sql = "SELECT u.departamento, COUNT(DISTINCT u.id) AS colaboradores, COUNT(m.id) AS matriculas, "
                + "COALESCE(SUM(m.progresso >= 100), 0) AS concluidas, "
                + "COALESCE(SUM(m.data_conclusao >= ?), 0) AS concluidas_periodo, "
                + "COALESCE(ROUND(AVG(m.progresso)), 0) AS progresso "
                + "FROM usuarios u LEFT JOIN matriculas m ON m.id_usuario = u.id "
                + "WHERE" + ATIVOS + filtroDepartamento(departamento, valores)
                + "GROUP BY u.departamento ORDER BY u.departamento";
        List<ConclusaoDepartamento> lista = new ArrayList<>();
        try (PreparedStatement ps = preparar(sql, valores); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(new ConclusaoDepartamento(rs.getString("departamento"), rs.getInt("colaboradores"),
                        rs.getInt("matriculas"), rs.getInt("concluidas"), rs.getInt("concluidas_periodo"),
                        rs.getInt("progresso")));
            }
        }
        return lista;
    }

    public List<HorasDepartamento> horas(Instant desde, String departamento) throws SQLException {
        List<Object> valores = new ArrayList<>(List.of(desde, desde));
        // Primeiro por pessoa (tabela derivada), depois somado por departamento.
        String sql = "SELECT t.departamento, COUNT(*) AS colaboradores, COALESCE(SUM(t.segundos), 0) AS segundos, "
                + "COALESCE(SUM(t.certificados), 0) AS certificados FROM ("
                + "SELECT u.departamento, "
                + "(SELECT COALESCE(SUM(a.duracao_segundos), 0) FROM progresso_aulas pa "
                + "  JOIN aulas a ON a.id = pa.id_aula WHERE pa.id_usuario = u.id AND pa.status = 'concluida' "
                + "  AND pa.concluida_em >= ?) AS segundos, "
                + "(SELECT COUNT(*) FROM certificados c WHERE c.id_usuario = u.id AND c.emitido_em >= ?) AS certificados "
                + "FROM usuarios u WHERE" + ATIVOS + filtroDepartamento(departamento, valores)
                + ") t GROUP BY t.departamento ORDER BY t.departamento";
        List<HorasDepartamento> lista = new ArrayList<>();
        try (PreparedStatement ps = preparar(sql, valores); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(new HorasDepartamento(rs.getString("departamento"), rs.getInt("colaboradores"),
                        rs.getLong("segundos"), rs.getInt("certificados")));
            }
        }
        return lista;
    }

    /** Todos os cursos; matriculados e concluintes contam só os colaboradores do filtro. */
    public List<AvaliacaoCurso> avaliacoes(Instant desde, String departamento) throws SQLException {
        List<Object> valores = new ArrayList<>(List.of(desde));
        String sql = "SELECT c.titulo, cat.nome AS categoria, c.instrutor_nome, c.nota, c.total_avaliacoes, "
                + "COUNT(m.id) AS matriculados, COALESCE(SUM(m.data_conclusao >= ?), 0) AS concluintes "
                + "FROM cursos c JOIN categorias cat ON cat.id = c.id_categoria "
                + "LEFT JOIN (matriculas m JOIN usuarios u ON u.id = m.id_usuario AND" + ATIVOS
                + filtroDepartamento(departamento, valores) + ") ON m.id_curso = c.id "
                + "GROUP BY c.id, c.titulo, cat.nome, c.instrutor_nome, c.nota, c.total_avaliacoes "
                + "ORDER BY c.nota DESC, c.titulo";
        List<AvaliacaoCurso> lista = new ArrayList<>();
        try (PreparedStatement ps = preparar(sql, valores); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(new AvaliacaoCurso(rs.getString("titulo"), rs.getString("categoria"),
                        rs.getString("instrutor_nome"), rs.getDouble("nota"), rs.getInt("total_avaliacoes"),
                        rs.getInt("matriculados"), rs.getInt("concluintes")));
            }
        }
        return lista;
    }

    public List<Desempenho> desempenho(Instant desde, String departamento) throws SQLException {
        List<Object> valores = new ArrayList<>(List.of(desde));
        String sql = "SELECT u.nome, u.departamento, u.ultimo_acesso, "
                + "COALESCE(SUM(m.progresso >= 100), 0) AS concluidos, "
                + "COALESCE(SUM(m.progresso > 0 AND m.progresso < 100), 0) AS andamento, "
                + "COALESCE(ROUND(AVG(m.progresso)), 0) AS progresso, "
                + "(SELECT COUNT(*) FROM certificados c WHERE c.id_usuario = u.id) AS certificados, "
                + "(SELECT COUNT(*) FROM progresso_aulas pa WHERE pa.id_usuario = u.id AND pa.status = 'concluida' "
                + "  AND pa.concluida_em >= ?) AS aulas "
                + "FROM usuarios u LEFT JOIN matriculas m ON m.id_usuario = u.id "
                + "WHERE" + ATIVOS + filtroDepartamento(departamento, valores)
                + "GROUP BY u.id, u.nome, u.departamento, u.ultimo_acesso ORDER BY u.departamento, u.nome";
        List<Desempenho> lista = new ArrayList<>();
        try (PreparedStatement ps = preparar(sql, valores); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(new Desempenho(rs.getString("nome"), rs.getString("departamento"), rs.getInt("concluidos"),
                        rs.getInt("andamento"), rs.getInt("progresso"), rs.getInt("certificados"), rs.getInt("aulas"),
                        Jdbc.instante(rs, "ultimo_acesso")));
            }
        }
        return lista;
    }

    /** Treinamentos obrigatórios = cursos da categoria "conformidade"; uma linha por pessoa e curso. */
    public List<Conformidade> conformidade(String departamento) throws SQLException {
        List<Object> valores = new ArrayList<>();
        String sql = "SELECT u.matricula, u.nome, u.departamento, c.titulo, m.progresso, m.data_conclusao "
                + "FROM usuarios u CROSS JOIN cursos c "
                + "LEFT JOIN matriculas m ON m.id_usuario = u.id AND m.id_curso = c.id "
                + "WHERE c.id_categoria = 'conformidade' AND" + ATIVOS + filtroDepartamento(departamento, valores)
                + "ORDER BY u.departamento, u.nome, c.titulo";
        List<Conformidade> lista = new ArrayList<>();
        try (PreparedStatement ps = preparar(sql, valores); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                int progresso = rs.getInt("progresso");
                lista.add(new Conformidade(rs.getString("matricula"), rs.getString("nome"),
                        rs.getString("departamento"), rs.getString("titulo"), rs.wasNull() ? null : progresso,
                        Jdbc.instante(rs, "data_conclusao")));
            }
        }
        return lista;
    }

    /** Acrescenta o filtro (e o valor) quando há departamento. */
    private static String filtroDepartamento(String departamento, List<Object> valores) {
        if (departamento == null) return " ";
        valores.add(departamento);
        return " AND u.departamento = ? ";
    }

    private PreparedStatement preparar(String sql, List<Object> valores) throws SQLException {
        PreparedStatement ps = conexao.prepareStatement(sql);
        try {
            Jdbc.preencher(ps, valores.toArray());
            return ps;
        } catch (SQLException e) {
            ps.close();
            throw e;
        }
    }
}
