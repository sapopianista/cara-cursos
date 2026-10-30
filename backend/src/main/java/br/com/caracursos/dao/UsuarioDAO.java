package br.com.caracursos.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;

import br.com.caracursos.model.Usuario;
import br.com.caracursos.model.Usuario.Status;
import br.com.caracursos.model.Usuario.TipoPerfil;

/** Acesso à tabela {@code usuarios}. */
public class UsuarioDAO {

    static final String COLUNAS = "u.id, u.matricula, u.nome, u.email, u.senha, u.tipo_perfil, u.cargo, "
            + "u.departamento, u.nivel, u.status, u.meta_semanal_minutos, u.notificacoes_email, "
            + "u.resumo_semanal, u.ultimo_acesso, u.criado_em";

    private final Connection conexao;

    public UsuarioDAO(Connection conexao) {
        this.conexao = conexao;
    }

    public Usuario buscarPorId(int id) throws SQLException {
        return buscarUm("SELECT " + COLUNAS + " FROM usuarios u WHERE u.id = ?", id);
    }

    /** O e-mail é comparado sem diferenciar maiúsculas (collation _ci). */
    public Usuario buscarPorEmail(String email) throws SQLException {
        return buscarUm("SELECT " + COLUNAS + " FROM usuarios u WHERE u.email = ?", email);
    }

    public boolean emailEmUso(String email, Integer ignorarId) throws SQLException {
        String sql = "SELECT 1 FROM usuarios WHERE email = ? AND id <> ?";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, email, ignorarId == null ? 0 : ignorarId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    /** Insere e devolve o usuário com id e matrícula ({@code COL-0125}) preenchidos. */
    public Usuario inserir(Usuario u) throws SQLException {
        String sql = "INSERT INTO usuarios (nome, email, senha, tipo_perfil, cargo, departamento, nivel, status, criado_em) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        Instant agora = Jdbc.agora();
        try (PreparedStatement ps = conexao.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            Jdbc.preencher(ps, u.getNome(), u.getEmail(), u.getSenha(), u.getTipoPerfil().getValorBanco(),
                    u.getCargo(), u.getDepartamento(), u.getNivel(), u.getStatus().getValorBanco(), agora);
            ps.executeUpdate();
            try (ResultSet chaves = ps.getGeneratedKeys()) {
                chaves.next();
                u.setId(chaves.getInt(1));
            }
        }
        u.setMatricula(String.format("COL-%04d", u.getId()));
        u.setCriadoEm(agora);
        try (PreparedStatement ps = conexao.prepareStatement("UPDATE usuarios SET matricula = ? WHERE id = ?")) {
            Jdbc.preencher(ps, u.getMatricula(), u.getId());
            ps.executeUpdate();
        }
        return u;
    }

    /** Atualiza os dados cadastrais (não mexe em senha, status nem perfil). */
    public void atualizarCadastro(Usuario u) throws SQLException {
        String sql = "UPDATE usuarios SET nome = ?, email = ?, cargo = ?, departamento = ?, nivel = ? WHERE id = ?";
        executar(sql, u.getNome(), u.getEmail(), u.getCargo(), u.getDepartamento(), u.getNivel(), u.getId());
    }

    public void atualizarStatus(int id, Status status) throws SQLException {
        executar("UPDATE usuarios SET status = ? WHERE id = ?", status.getValorBanco(), id);
    }

    public void atualizarPreferencias(Usuario u) throws SQLException {
        executar("UPDATE usuarios SET meta_semanal_minutos = ?, notificacoes_email = ?, resumo_semanal = ? WHERE id = ?",
                u.getMetaSemanalMinutos(), u.isNotificacoesEmail(), u.isResumoSemanal(), u.getId());
    }

    public void registrarAcesso(int id, Instant quando) throws SQLException {
        executar("UPDATE usuarios SET ultimo_acesso = ? WHERE id = ?", quando, id);
    }

    /** Licenças em uso = colaboradores que não estão inativos (ativos + convites pendentes). */
    public int contarLicencasEmUso() throws SQLException {
        try (Statement st = conexao.createStatement();
             ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM usuarios WHERE status <> 'inativo'")) {
            rs.next();
            return rs.getInt(1);
        }
    }

    public record Empresa(int id, String nome) {
    }

    public Empresa empresa() throws SQLException {
        try (Statement st = conexao.createStatement();
             ResultSet rs = st.executeQuery("SELECT id, nome_fantasia FROM empresa WHERE id = 1")) {
            return rs.next() ? new Empresa(rs.getInt(1), rs.getString(2)) : null;
        }
    }

    public int licencasContratadas() throws SQLException {
        try (Statement st = conexao.createStatement();
             ResultSet rs = st.executeQuery("SELECT licencas_contratadas FROM empresa WHERE id = 1")) {
            return rs.next() ? rs.getInt(1) : 0;
        }
    }

    private Usuario buscarUm(String sql, Object... valores) throws SQLException {
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, valores);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapear(rs) : null;
            }
        }
    }

    private void executar(String sql, Object... valores) throws SQLException {
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, valores);
            ps.executeUpdate();
        }
    }

    static Usuario mapear(ResultSet rs) throws SQLException {
        Usuario u = new Usuario(rs.getInt("id"), rs.getString("nome"), rs.getString("email"),
                rs.getString("senha"), TipoPerfil.deValorBanco(rs.getString("tipo_perfil")));
        u.setMatricula(rs.getString("matricula"));
        u.setCargo(rs.getString("cargo"));
        u.setDepartamento(rs.getString("departamento"));
        u.setNivel(rs.getInt("nivel"));
        u.setStatus(Status.deValorBanco(rs.getString("status")));
        u.setMetaSemanalMinutos(rs.getInt("meta_semanal_minutos"));
        u.setNotificacoesEmail(rs.getBoolean("notificacoes_email"));
        u.setResumoSemanal(rs.getBoolean("resumo_semanal"));
        u.setUltimoAcesso(Jdbc.instante(rs, "ultimo_acesso"));
        u.setCriadoEm(Jdbc.instante(rs, "criado_em"));
        return u;
    }
}
