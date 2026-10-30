package br.com.caracursos.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import br.com.caracursos.http.Pagina;

/** Visão de gestão dos usuários: listagem com progresso agregado, resumo e opções de cadastro. */
public class ColaboradorDAO {

    /** Formato {@code Colaborador} do contrato. */
    public record Colaborador(int id, String matricula, String nome, String email, String cargo, String departamento,
                              int nivel, int progresso, int cursosConcluidos, String status, Instant ultimoAcesso,
                              Instant criadoEm) {
    }

    /** Filtros de {@code GET /admin/colaboradores}. {@code status} "todos" ou nulo = sem filtro. */
    public record Filtro(String busca, String status, String departamento) {
    }

    public record Resumo(int total, int ativos, int pendentes, int inativos, int conclusaoMedia) {
    }

    // Progresso do colaborador = média do progresso nas matrículas (0 se não tem nenhuma).
    private static final String SELECT = "SELECT u.id, u.matricula, u.nome, u.email, u.cargo, u.departamento, "
            + "u.nivel, u.status, u.ultimo_acesso, u.criado_em, "
            + "COALESCE(ROUND(AVG(m.progresso)), 0) AS progresso, "
            + "COALESCE(SUM(m.progresso >= 100), 0) AS concluidos "
            + "FROM usuarios u LEFT JOIN matriculas m ON m.id_usuario = u.id ";
    private static final String AGRUPAR = " GROUP BY u.id, u.matricula, u.nome, u.email, u.cargo, u.departamento, "
            + "u.nivel, u.status, u.ultimo_acesso, u.criado_em";

    private final Connection conexao;

    public ColaboradorDAO(Connection conexao) {
        this.conexao = conexao;
    }

    public Pagina<Colaborador> listar(Filtro f, int pagina, int porPagina) throws SQLException {
        List<Object> valores = new ArrayList<>();
        String where = montarWhere(f, valores);

        int total;
        try (PreparedStatement ps = conexao.prepareStatement("SELECT COUNT(*) FROM usuarios u" + where)) {
            Jdbc.preencher(ps, valores.toArray());
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                total = rs.getInt(1);
            }
        }
        Pagina.Recorte recorte = Pagina.recortar(pagina, porPagina, total);
        valores.add(recorte.porPagina());
        valores.add(recorte.deslocamento());
        List<Colaborador> itens = consultar(SELECT + where + AGRUPAR + " ORDER BY u.nome LIMIT ? OFFSET ?",
                valores.toArray());
        return Pagina.de(itens, total, recorte);
    }

    /** Todos que atendem ao filtro, sem paginação (exportação CSV). */
    public List<Colaborador> listarTodos(Filtro f) throws SQLException {
        List<Object> valores = new ArrayList<>();
        String where = montarWhere(f, valores);
        return consultar(SELECT + where + AGRUPAR + " ORDER BY u.nome", valores.toArray());
    }

    public Colaborador buscar(int id) throws SQLException {
        List<Colaborador> lista = consultar(SELECT + "WHERE u.id = ?" + AGRUPAR, id);
        return lista.isEmpty() ? null : lista.getFirst();
    }

    public Resumo resumo() throws SQLException {
        String sql = "SELECT COUNT(*) AS total, COALESCE(SUM(status = 'ativo'), 0) AS ativos, "
                + "COALESCE(SUM(status = 'pendente'), 0) AS pendentes, COALESCE(SUM(status = 'inativo'), 0) AS inativos "
                + "FROM usuarios";
        try (Statement st = conexao.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            rs.next();
            return new Resumo(rs.getInt("total"), rs.getInt("ativos"), rs.getInt("pendentes"), rs.getInt("inativos"),
                    conclusaoMediaDosAtivos());
        }
    }

    /** Média, entre os colaboradores ativos, do progresso de cada um. */
    public int conclusaoMediaDosAtivos() throws SQLException {
        String sql = "SELECT COALESCE(ROUND(AVG(p.progresso)), 0) FROM ("
                + "SELECT COALESCE(AVG(m.progresso), 0) AS progresso FROM usuarios u "
                + "LEFT JOIN matriculas m ON m.id_usuario = u.id WHERE u.status = 'ativo' GROUP BY u.id) p";
        try (Statement st = conexao.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            rs.next();
            return rs.getInt(1);
        }
    }

    public List<String> departamentos() throws SQLException {
        return nomes("SELECT nome FROM departamentos ORDER BY nome");
    }

    public List<String> cargos() throws SQLException {
        return nomes("SELECT nome FROM cargos ORDER BY nome");
    }

    // ---- painel (visão geral) ---------------------------------------------

    public int contarAtivos() throws SQLException {
        return contar("SELECT COUNT(*) FROM usuarios WHERE status = 'ativo'");
    }

    public int contarAtivosQueAcessaramDesde(Instant desde) throws SQLException {
        return contar("SELECT COUNT(*) FROM usuarios WHERE status = 'ativo' AND ultimo_acesso >= ?", desde);
    }

    /** Ativos com último acesso mais recente primeiro. */
    public List<Colaborador> acessosRecentes(int limite) throws SQLException {
        return consultar(SELECT + "WHERE u.status = 'ativo' AND u.ultimo_acesso IS NOT NULL" + AGRUPAR
                + " ORDER BY u.ultimo_acesso DESC LIMIT ?", limite);
    }

    private static String montarWhere(Filtro f, List<Object> valores) {
        StringBuilder where = new StringBuilder(" WHERE 1 = 1");
        if (f.busca() != null) {
            where.append(" AND (u.nome LIKE ? OR u.email LIKE ? OR u.departamento LIKE ? OR u.cargo LIKE ?)");
            String termo = Jdbc.contem(f.busca());
            for (int i = 0; i < 4; i++) valores.add(termo);
        }
        if (f.status() != null && !"todos".equals(f.status())) {
            where.append(" AND u.status = ?");
            valores.add(f.status());
        }
        if (f.departamento() != null) {
            where.append(" AND u.departamento = ?");
            valores.add(f.departamento());
        }
        return where.toString();
    }

    private int contar(String sql, Object... valores) throws SQLException {
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, valores);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }

    private List<String> nomes(String sql) throws SQLException {
        List<String> lista = new ArrayList<>();
        try (Statement st = conexao.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            while (rs.next()) lista.add(rs.getString(1));
        }
        return lista;
    }

    private List<Colaborador> consultar(String sql, Object... valores) throws SQLException {
        List<Colaborador> lista = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, valores);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(new Colaborador(rs.getInt("id"), rs.getString("matricula"), rs.getString("nome"),
                            rs.getString("email"), rs.getString("cargo"), rs.getString("departamento"),
                            rs.getInt("nivel"), rs.getInt("progresso"), rs.getInt("concluidos"),
                            rs.getString("status"), Jdbc.instante(rs, "ultimo_acesso"),
                            Jdbc.instante(rs, "criado_em")));
                }
            }
        }
        return lista;
    }
}
