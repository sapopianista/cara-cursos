package br.com.caracursos.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/** Dados e configurações da empresa (tabela {@code empresa}, linha única id = 1). */
public class EmpresaDAO {

    public record Organizacao(String nomeFantasia, String razaoSocial, String cnpj, String emailNotificacao,
                              String fusoHorario, String dominiosAutorizados) {
    }

    // Nomes de campo iguais ao contrato (exigir2FA, não exigir2fa).
    public record Politicas(boolean exigirPresencaMinima, boolean certificacaoAutomatica,
                            boolean permitirDownloadMateriais, boolean exigir2FA) {
    }

    /** Formato de {@code GET/PUT /admin/configuracoes}. */
    public record Configuracoes(Organizacao organizacao, Politicas politicas) {
    }

    private final Connection conexao;

    public EmpresaDAO(Connection conexao) {
        this.conexao = conexao;
    }

    public Configuracoes configuracoes() throws SQLException {
        String sql = "SELECT nome_fantasia, razao_social, cnpj, email_notificacao, fuso_horario, dominios_autorizados, "
                + "exigir_presenca_minima, certificacao_automatica, permitir_download_materiais, exigir_2fa "
                + "FROM empresa WHERE id = 1";
        try (Statement st = conexao.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            if (!rs.next()) return null;
            return new Configuracoes(
                    new Organizacao(rs.getString("nome_fantasia"), rs.getString("razao_social"), rs.getString("cnpj"),
                            rs.getString("email_notificacao"), rs.getString("fuso_horario"),
                            rs.getString("dominios_autorizados")),
                    new Politicas(rs.getBoolean("exigir_presenca_minima"), rs.getBoolean("certificacao_automatica"),
                            rs.getBoolean("permitir_download_materiais"), rs.getBoolean("exigir_2fa")));
        }
    }

    public void salvar(Configuracoes c) throws SQLException {
        String sql = "UPDATE empresa SET nome_fantasia = ?, razao_social = ?, cnpj = ?, email_notificacao = ?, "
                + "fuso_horario = ?, dominios_autorizados = ?, exigir_presenca_minima = ?, certificacao_automatica = ?, "
                + "permitir_download_materiais = ?, exigir_2fa = ? WHERE id = 1";
        Organizacao o = c.organizacao();
        Politicas p = c.politicas();
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, o.nomeFantasia(), o.razaoSocial(), o.cnpj(), o.emailNotificacao(), o.fusoHorario(),
                    o.dominiosAutorizados(), p.exigirPresencaMinima(), p.certificacaoAutomatica(),
                    p.permitirDownloadMateriais(), p.exigir2FA());
            ps.executeUpdate();
        }
    }
}
