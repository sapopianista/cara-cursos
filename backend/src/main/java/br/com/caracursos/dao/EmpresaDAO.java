package br.com.caracursos.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.ZoneId;
import java.util.List;

import br.com.caracursos.util.Email;
import br.com.caracursos.util.Relogio;

/** Dados e configurações da empresa (tabela {@code empresa}, linha única id = 1). */
public class EmpresaDAO {

    public record Organizacao(String nomeFantasia, String razaoSocial, String cnpj, String emailNotificacao,
                              String fusoHorario, String dominiosAutorizados) {
    }

    public record Politicas(boolean exigirPresencaMinima, boolean certificacaoAutomatica,
                            boolean permitirDownloadMateriais) {
    }

    /** Resumo da empresa para identificação na sessão e certificados. */
    public record Resumo(int id, String nome) {
    }

    /** Formato de {@code GET/PUT /admin/configuracoes}. */
    public record Configuracoes(Organizacao organizacao, Politicas politicas) {
    }

    private final Connection conexao;

    public EmpresaDAO(Connection conexao) {
        this.conexao = conexao;
    }

    public Resumo resumo() throws SQLException {
        try (Statement st = conexao.createStatement();
             ResultSet rs = st.executeQuery("SELECT id, nome_fantasia FROM empresa WHERE id = 1")) {
            return rs.next() ? new Resumo(rs.getInt(1), rs.getString(2)) : null;
        }
    }

    public int licencasContratadas() throws SQLException {
        try (Statement st = conexao.createStatement();
             ResultSet rs = st.executeQuery("SELECT licencas_contratadas FROM empresa WHERE id = 1")) {
            return rs.next() ? rs.getInt(1) : 0;
        }
    }

    /** Lê o total de licenças contratadas travando a linha da empresa até o fim da transação. */
    public int licencasContratadasTravando() throws SQLException {
        try (Statement st = conexao.createStatement();
             ResultSet rs = st.executeQuery("SELECT licencas_contratadas FROM empresa WHERE id = 1 FOR UPDATE")) {
            return rs.next() ? rs.getInt(1) : 0;
        }
    }

    public ZoneId fusoHorario() throws SQLException {
        try (Statement st = conexao.createStatement();
             ResultSet rs = st.executeQuery("SELECT fuso_horario FROM empresa WHERE id = 1")) {
            return Relogio.fuso(rs.next() ? rs.getString(1) : null);
        }
    }

    public List<String> dominiosAutorizados() throws SQLException {
        try (Statement st = conexao.createStatement();
             ResultSet rs = st.executeQuery("SELECT dominios_autorizados FROM empresa WHERE id = 1")) {
            return rs.next() ? Email.dominios(rs.getString(1)) : List.of();
        }
    }

    public Politicas politicas() throws SQLException {
        String sql = "SELECT exigir_presenca_minima, certificacao_automatica, permitir_download_materiais "
                + "FROM empresa WHERE id = 1";
        try (Statement st = conexao.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            return rs.next()
                    ? new Politicas(rs.getBoolean(1), rs.getBoolean(2), rs.getBoolean(3))
                    : new Politicas(true, true, true);
        }
    }

    public Configuracoes configuracoes() throws SQLException {
        String sql = "SELECT nome_fantasia, razao_social, cnpj, email_notificacao, fuso_horario, dominios_autorizados, "
                + "exigir_presenca_minima, certificacao_automatica, permitir_download_materiais "
                + "FROM empresa WHERE id = 1";
        try (Statement st = conexao.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            if (!rs.next()) return null;
            return new Configuracoes(
                    new Organizacao(rs.getString("nome_fantasia"), rs.getString("razao_social"), rs.getString("cnpj"),
                            rs.getString("email_notificacao"), rs.getString("fuso_horario"),
                            rs.getString("dominios_autorizados")),
                    new Politicas(rs.getBoolean("exigir_presenca_minima"), rs.getBoolean("certificacao_automatica"),
                            rs.getBoolean("permitir_download_materiais")));
        }
    }

    public void salvar(Configuracoes c) throws SQLException {
        String sql = "UPDATE empresa SET nome_fantasia = ?, razao_social = ?, cnpj = ?, email_notificacao = ?, "
                + "fuso_horario = ?, dominios_autorizados = ?, exigir_presenca_minima = ?, certificacao_automatica = ?, "
                + "permitir_download_materiais = ? WHERE id = 1";
        Organizacao o = c.organizacao();
        Politicas p = c.politicas();
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, o.nomeFantasia(), o.razaoSocial(), o.cnpj(), o.emailNotificacao(), o.fusoHorario(),
                    o.dominiosAutorizados(), p.exigirPresencaMinima(), p.certificacaoAutomatica(),
                    p.permitirDownloadMateriais());
            ps.executeUpdate();
        }
    }
}
