package br.com.caracursos.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import br.com.caracursos.model.Usuario.TipoPerfil;

/**
 * Gestores do painel (tabela {@code gestores} + {@code usuarios.tipo_perfil}).
 * O id do gestor é o id do usuário.
 */
public class GestorDAO {

    /** Formato {@code Gestor} do contrato. {@code ultimoAcesso} só vem depois que o convite foi aceito. */
    public record Gestor(int id, int colaboradorId, String nome, String email, String departamento, String papel,
                         String status, Instant convidadoEm, Instant ultimoAcesso) {
    }

    public record Candidato(int id, String nome, String email, String departamento) {
    }

    /** Convite aceito = entrou depois de ser convidado. */
    private static final String ACEITO = "(u.ultimo_acesso IS NOT NULL AND u.ultimo_acesso >= g.convidado_em)";

    private static final String SELECT = "SELECT u.id, u.nome, u.email, u.departamento, u.tipo_perfil, "
            + "u.ultimo_acesso, g.convidado_em, " + ACEITO + " AS aceito "
            + "FROM gestores g JOIN usuarios u ON u.id = g.id_usuario ";

    private final Connection conexao;

    public GestorDAO(Connection conexao) {
        this.conexao = conexao;
    }

    public List<Gestor> listar() throws SQLException {
        return consultar(SELECT + "ORDER BY u.nome");
    }

    public Gestor buscar(int id) throws SQLException {
        List<Gestor> lista = consultar(SELECT + "WHERE u.id = ?", id);
        return lista.isEmpty() ? null : lista.getFirst();
    }

    /** Usuários que ainda não são gestores e não estão inativos. */
    public List<Candidato> candidatos() throws SQLException {
        String sql = "SELECT u.id, u.nome, u.email, u.departamento FROM usuarios u "
                + "WHERE u.status <> 'inativo' AND NOT EXISTS (SELECT 1 FROM gestores g WHERE g.id_usuario = u.id) "
                + "ORDER BY u.nome";
        List<Candidato> lista = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(new Candidato(rs.getInt("id"), rs.getString("nome"), rs.getString("email"),
                        rs.getString("departamento")));
            }
        }
        return lista;
    }

    /**
     * Administradores que conseguem entrar (conta ativa e convite aceito). Trava as linhas
     * dos administradores até o fim da transação, para duas revogações simultâneas não
     * deixarem a empresa sem nenhum.
     */
    public int contarAdminsAtivosTravando() throws SQLException {
        String sql = "SELECT u.id, " + ACEITO + " AS aceito FROM usuarios u JOIN gestores g ON g.id_usuario = u.id "
                + "WHERE u.tipo_perfil = 'admin' AND u.status = 'ativo' FOR UPDATE";
        int total = 0;
        try (PreparedStatement ps = conexao.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                if (rs.getBoolean("aceito")) total++;
            }
        }
        return total;
    }

    public void inserir(int idUsuario, TipoPerfil papel, Instant convidadoEm) throws SQLException {
        executar("INSERT INTO gestores (id_usuario, convidado_em) VALUES (?, ?)", idUsuario, convidadoEm);
        definirPapel(idUsuario, papel);
    }

    public void definirPapel(int idUsuario, TipoPerfil papel) throws SQLException {
        executar("UPDATE usuarios SET tipo_perfil = ? WHERE id = ?", papel.getValorBanco(), idUsuario);
    }

    public void reenviarConvite(int idUsuario, Instant quando) throws SQLException {
        executar("UPDATE gestores SET convidado_em = ? WHERE id_usuario = ?", quando, idUsuario);
    }

    /** Remove o acesso ao painel: a pessoa volta a ser só colaboradora. */
    public void remover(int idUsuario) throws SQLException {
        executar("DELETE FROM gestores WHERE id_usuario = ?", idUsuario);
        definirPapel(idUsuario, TipoPerfil.COLABORADOR);
    }

    private void executar(String sql, Object... valores) throws SQLException {
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, valores);
            ps.executeUpdate();
        }
    }

    private List<Gestor> consultar(String sql, Object... valores) throws SQLException {
        List<Gestor> lista = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, valores);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    boolean aceito = rs.getBoolean("aceito");
                    int id = rs.getInt("id");
                    lista.add(new Gestor(id, id, rs.getString("nome"), rs.getString("email"),
                            rs.getString("departamento"), rs.getString("tipo_perfil"), aceito ? "ativo" : "pendente",
                            Jdbc.instante(rs, "convidado_em"), aceito ? Jdbc.instante(rs, "ultimo_acesso") : null));
                }
            }
        }
        return lista;
    }
}
