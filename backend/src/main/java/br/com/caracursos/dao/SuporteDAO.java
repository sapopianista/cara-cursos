package br.com.caracursos.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** Central de suporte (tabelas {@code faq} e {@code chamados}). {@code escopo} é "aluno" ou "gestor". */
public class SuporteDAO {

    public record Pergunta(int id, String pergunta, String resposta) {
    }

    public record CursoRef(int id, String titulo) {
    }

    /** Formato {@code Chamado} do contrato. */
    public record Chamado(int id, String assunto, String titulo, CursoRef curso, String status, Instant atualizadoEm) {
    }

    private static final String SELECT_CHAMADO = "SELECT ch.id, ch.assunto, ch.titulo, ch.status, ch.atualizado_em, "
            + "c.id AS curso_id, c.titulo AS curso_titulo "
            + "FROM chamados ch LEFT JOIN cursos c ON c.id = ch.id_curso ";

    private final Connection conexao;

    public SuporteDAO(Connection conexao) {
        this.conexao = conexao;
    }

    public List<Pergunta> faq(String escopo) throws SQLException {
        List<Pergunta> lista = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement(
                "SELECT id, pergunta, resposta FROM faq WHERE escopo = ? ORDER BY ordem, id")) {
            Jdbc.preencher(ps, escopo);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(new Pergunta(rs.getInt("id"), rs.getString("pergunta"), rs.getString("resposta")));
                }
            }
        }
        return lista;
    }

    /** Cursos que o aluno pode citar no chamado. */
    public List<CursoRef> cursos() throws SQLException {
        List<CursoRef> lista = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement("SELECT id, titulo FROM cursos ORDER BY titulo");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) lista.add(new CursoRef(rs.getInt("id"), rs.getString("titulo")));
        }
        return lista;
    }

    public boolean cursoExiste(int id) throws SQLException {
        try (PreparedStatement ps = conexao.prepareStatement("SELECT 1 FROM cursos WHERE id = ?")) {
            Jdbc.preencher(ps, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    /** Chamados do aluno: só os que ele abriu. */
    public List<Chamado> chamadosDoAluno(int idUsuario) throws SQLException {
        return consultar(SELECT_CHAMADO + "WHERE ch.escopo = 'aluno' AND ch.id_usuario = ? "
                + "ORDER BY ch.atualizado_em DESC, ch.id DESC", idUsuario);
    }

    /** Chamados do painel: todos os abertos por gestores da empresa. */
    public List<Chamado> chamadosDaEmpresa() throws SQLException {
        return consultar(SELECT_CHAMADO + "WHERE ch.escopo = 'gestor' ORDER BY ch.atualizado_em DESC, ch.id DESC");
    }

    public Chamado buscar(int id) throws SQLException {
        List<Chamado> lista = consultar(SELECT_CHAMADO + "WHERE ch.id = ?", id);
        return lista.isEmpty() ? null : lista.getFirst();
    }

    /** Devolve o id do chamado criado (status "em_analise"). */
    public int criar(int idUsuario, String escopo, String assunto, String titulo, Integer idCurso, String descricao)
            throws SQLException {
        String sql = "INSERT INTO chamados (id_usuario, escopo, assunto, titulo, id_curso, descricao, criado_em, "
                + "atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        Instant agora = Jdbc.agora();
        try (PreparedStatement ps = conexao.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            Jdbc.preencher(ps, idUsuario, escopo, assunto, titulo, idCurso, descricao, agora, agora);
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }

    private List<Chamado> consultar(String sql, Object... valores) throws SQLException {
        List<Chamado> lista = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, valores);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int idCurso = rs.getInt("curso_id");
                    CursoRef curso = rs.wasNull() ? null : new CursoRef(idCurso, rs.getString("curso_titulo"));
                    lista.add(new Chamado(rs.getInt("id"), rs.getString("assunto"), rs.getString("titulo"), curso,
                            rs.getString("status"), Jdbc.instante(rs, "atualizado_em")));
                }
            }
        }
        return lista;
    }
}
