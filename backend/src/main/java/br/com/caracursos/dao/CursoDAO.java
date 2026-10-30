package br.com.caracursos.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import br.com.caracursos.http.Json;
import br.com.caracursos.http.Pagina;
import br.com.caracursos.model.Curso;
import br.com.caracursos.model.CursoResumo;

/** Catálogo: cursos (com o progresso do usuário), categorias, áreas e materiais. */
public class CursoDAO {

    /** Filtros de {@code GET /cursos}. Todos opcionais. */
    public record Filtro(String q, String categoria, String area, String nivel) {
    }

    public record Area(String id, String nome, String icone, List<String> competencias, int totalCursos,
                       int duracaoMinutos) {
    }

    public record Material(int id, String nome, long tamanhoBytes, String url) {
    }

    // O primeiro parâmetro de toda consulta é o id do usuário logado (para o progresso).
    private static final String SELECT = "SELECT c.id, c.titulo, c.descricao, c.carga_horaria_minutos, c.nivel, "
            + "c.tema, c.imagem_url, c.instrutor_nome, c.instrutor_cargo, c.nota, c.total_avaliacoes, "
            + "cat.id AS cat_id, cat.nome AS cat_nome, a.id AS area_id, a.nome AS area_nome, "
            + "(SELECT COUNT(*) FROM aulas au WHERE au.id_curso = c.id) AS total_aulas, "
            + "COALESCE(m.progresso, 0) AS progresso "
            + "FROM cursos c "
            + "JOIN categorias cat ON cat.id = c.id_categoria "
            + "JOIN areas a ON a.id = c.id_area "
            + "LEFT JOIN matriculas m ON m.id_curso = c.id AND m.id_usuario = ? ";

    private final Connection conexao;

    public CursoDAO(Connection conexao) {
        this.conexao = conexao;
    }

    /**
     * {@code q} busca em título, descrição e instrutor (sem diferenciar acentos/maiúsculas,
     * pela collation da tabela). {@code nivel} também inclui cursos para {@code todos}.
     */
    public Pagina<Curso> listar(Filtro f, int idUsuario, int pagina, int porPagina) throws SQLException {
        StringBuilder where = new StringBuilder(" WHERE 1 = 1");
        List<Object> valores = new ArrayList<>();
        if (f.q() != null) {
            where.append(" AND (c.titulo LIKE ? OR c.descricao LIKE ? OR c.instrutor_nome LIKE ?)");
            String termo = Jdbc.contem(f.q());
            valores.add(termo);
            valores.add(termo);
            valores.add(termo);
        }
        if (f.categoria() != null) {
            where.append(" AND c.id_categoria = ?");
            valores.add(f.categoria());
        }
        if (f.area() != null) {
            where.append(" AND c.id_area = ?");
            valores.add(f.area());
        }
        if (f.nivel() != null) {
            where.append(" AND (c.nivel = ? OR c.nivel = 'todos')");
            valores.add(f.nivel());
        }

        int total;
        try (PreparedStatement ps = conexao.prepareStatement("SELECT COUNT(*) FROM cursos c" + where)) {
            Jdbc.preencher(ps, valores.toArray());
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                total = rs.getInt(1);
            }
        }

        Pagina.Recorte recorte = Pagina.recortar(pagina, porPagina, total);
        List<Object> comUsuario = new ArrayList<>();
        comUsuario.add(idUsuario);
        comUsuario.addAll(valores);
        comUsuario.add(recorte.porPagina());
        comUsuario.add(recorte.deslocamento());
        List<Curso> itens = consultar(SELECT + where + " ORDER BY c.id LIMIT ? OFFSET ?", comUsuario.toArray());
        return Pagina.de(itens, total, recorte);
    }

    public Curso buscar(int id, int idUsuario) throws SQLException {
        List<Curso> lista = consultar(SELECT + "WHERE c.id = ?", idUsuario, id);
        return lista.isEmpty() ? null : lista.getFirst();
    }

    /** Cursos na ordem dos ids informados (ex.: ordem sugerida de uma trilha). */
    public List<Curso> listarPorIds(List<Integer> ids, int idUsuario) throws SQLException {
        if (ids.isEmpty()) return List.of();
        String marcadores = String.join(", ", ids.stream().map(i -> "?").toList());
        List<Object> valores = new ArrayList<>();
        valores.add(idUsuario);
        valores.addAll(ids);
        List<Curso> cursos = consultar(SELECT + "WHERE c.id IN (" + marcadores + ")", valores.toArray());
        cursos.sort(Comparator.comparingInt(c -> ids.indexOf(c.getId())));
        return cursos;
    }

    public Curso destaqueDoMes(int idUsuario) throws SQLException {
        List<Curso> lista = consultar(SELECT + "WHERE c.destaque_do_mes ORDER BY c.id LIMIT 1", idUsuario);
        return lista.isEmpty() ? null : lista.getFirst();
    }

    public List<Curso> emDestaque(int idUsuario) throws SQLException {
        return consultar(SELECT + "WHERE c.destaque AND NOT c.destaque_do_mes ORDER BY c.id", idUsuario);
    }

    public List<Curso> lancamentos(int idUsuario) throws SQLException {
        return consultar(SELECT + "WHERE c.lancamento AND NOT c.destaque_do_mes ORDER BY c.id", idUsuario);
    }

    /** Cursos começados e não concluídos, do mais adiantado para o menos. */
    public List<Curso> emAndamento(int idUsuario, int limite) throws SQLException {
        return consultar(SELECT + "WHERE m.progresso > 0 AND m.progresso < 100 ORDER BY m.progresso DESC, c.id LIMIT ?",
                idUsuario, limite);
    }

    /** Cursos que o usuário ainda não começou, mais bem avaliados primeiro. */
    public List<Curso> naoIniciados(int idUsuario) throws SQLException {
        return consultar(SELECT + "WHERE m.id IS NULL ORDER BY c.nota DESC, c.total_avaliacoes DESC, c.id",
                idUsuario);
    }

    /** Cursos ainda não começados da mesma área ou categoria de {@code idCurso}, mais bem avaliados primeiro. */
    public List<Curso> relacionados(int idCurso, int idUsuario, int limite) throws SQLException {
        return consultar(SELECT + "WHERE m.id IS NULL AND c.id <> ? AND ("
                + "c.id_area = (SELECT id_area FROM cursos WHERE id = ?) "
                + "OR c.id_categoria = (SELECT id_categoria FROM cursos WHERE id = ?)) "
                + "ORDER BY c.nota DESC, c.total_avaliacoes DESC, c.id LIMIT ?",
                idUsuario, idCurso, idCurso, idCurso, limite);
    }

    /** Nota média (0–5) dos cursos que têm alunos matriculados. */
    public double notaMediaDosCursosEmUso() throws SQLException {
        String sql = "SELECT COALESCE(AVG(c.nota), 0) FROM cursos c "
                + "WHERE EXISTS (SELECT 1 FROM matriculas m WHERE m.id_curso = c.id)";
        try (Statement st = conexao.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            rs.next();
            return Math.round(rs.getDouble(1) * 10) / 10.0;
        }
    }

    public CursoResumo resumo(int idCurso) throws SQLException {
        String sql = "SELECT c.id, c.titulo, cat.nome FROM cursos c JOIN categorias cat ON cat.id = c.id_categoria "
                + "WHERE c.id = ?";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, idCurso);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? new CursoResumo(rs.getInt(1), rs.getString(2), rs.getString(3)) : null;
            }
        }
    }

    public List<Curso.Categoria> categorias() throws SQLException {
        List<Curso.Categoria> lista = new ArrayList<>();
        try (Statement st = conexao.createStatement();
             ResultSet rs = st.executeQuery("SELECT id, nome FROM categorias ORDER BY nome")) {
            while (rs.next()) lista.add(new Curso.Categoria(rs.getString("id"), rs.getString("nome")));
        }
        return lista;
    }

    public List<Area> areas() throws SQLException {
        String sql = "SELECT a.id, a.nome, a.icone, a.competencias, COUNT(c.id) AS total_cursos, "
                + "COALESCE(SUM(c.carga_horaria_minutos), 0) AS duracao "
                + "FROM areas a LEFT JOIN cursos c ON c.id_area = a.id "
                + "GROUP BY a.id, a.nome, a.icone, a.competencias ORDER BY a.nome";
        List<Area> lista = new ArrayList<>();
        try (Statement st = conexao.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            while (rs.next()) {
                lista.add(new Area(rs.getString("id"), rs.getString("nome"), rs.getString("icone"),
                        Json.listaDeTexto(rs.getString("competencias")), rs.getInt("total_cursos"),
                        rs.getInt("duracao")));
            }
        }
        return lista;
    }

    public List<Material> materiais(int idCurso) throws SQLException {
        String sql = "SELECT id, nome, tamanho_bytes, url FROM materiais WHERE id_curso = ? ORDER BY id";
        List<Material> lista = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, idCurso);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(new Material(rs.getInt("id"), rs.getString("nome"), rs.getLong("tamanho_bytes"),
                            rs.getString("url")));
                }
            }
        }
        return lista;
    }

    /** Resumo ({@code id, titulo, categoria}) de todos os cursos, por id. */
    public Map<Integer, CursoResumo> resumosPorId() throws SQLException {
        String sql = "SELECT c.id, c.titulo, cat.nome FROM cursos c JOIN categorias cat ON cat.id = c.id_categoria";
        Map<Integer, CursoResumo> mapa = new LinkedHashMap<>();
        try (Statement st = conexao.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            while (rs.next()) mapa.put(rs.getInt(1), new CursoResumo(rs.getInt(1), rs.getString(2), rs.getString(3)));
        }
        return mapa;
    }

    public Map<Integer, Integer> duracoesPorId() throws SQLException {
        Map<Integer, Integer> mapa = new LinkedHashMap<>();
        try (Statement st = conexao.createStatement();
             ResultSet rs = st.executeQuery("SELECT id, carga_horaria_minutos FROM cursos")) {
            while (rs.next()) mapa.put(rs.getInt(1), rs.getInt(2));
        }
        return mapa;
    }

    private List<Curso> consultar(String sql, Object... valores) throws SQLException {
        List<Curso> lista = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, valores);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) lista.add(mapear(rs));
            }
        }
        return lista;
    }

    private static Curso mapear(ResultSet rs) throws SQLException {
        Curso c = new Curso();
        c.setId(rs.getInt("id"));
        c.setTitulo(rs.getString("titulo"));
        c.setDescricao(rs.getString("descricao"));
        c.setCategoria(new Curso.Categoria(rs.getString("cat_id"), rs.getString("cat_nome")));
        c.setArea(new Curso.Categoria(rs.getString("area_id"), rs.getString("area_nome")));
        c.setNivel(rs.getString("nivel"));
        c.setDuracaoMinutos(rs.getInt("carga_horaria_minutos"));
        c.setTotalAulas(rs.getInt("total_aulas"));
        c.setNota(rs.getBigDecimal("nota").doubleValue());
        c.setTotalAvaliacoes(rs.getInt("total_avaliacoes"));
        c.setInstrutor(new Curso.Instrutor(rs.getString("instrutor_nome"), rs.getString("instrutor_cargo")));
        c.setTema(rs.getString("tema"));
        c.setImagemUrl(rs.getString("imagem_url"));
        c.setProgresso(rs.getInt("progresso"));
        return c;
    }
}
