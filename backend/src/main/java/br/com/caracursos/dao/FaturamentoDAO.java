package br.com.caracursos.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** Plano e faturamento (tabelas {@code contrato} e {@code faturas}, mais dados fiscais de {@code empresa}). */
public class FaturamentoDAO {

    /** Formato {@code contrato} do contrato da API; {@code licencasContratadas} vem de {@code empresa}. */
    public record Contrato(String numero, String plano, String status, Instant inicio, Instant renovacao,
                           int licencasContratadas, int valorLicencaMensalCentavos, String metodoPagamento,
                           String emailNotaFiscal) {
    }

    public record DadosFiscais(String razaoSocial, String cnpj, String endereco) {
    }

    /** {@code status} já vem como "vencida" quando a fatura está aberta e o dia do vencimento já passou. */
    public record Fatura(String id, Instant competencia, int licencas, Instant emitidaEm, Instant vencimento,
                         int valorCentavos, String status, String notaFiscal) {
    }

    private static final String SELECT_FATURA = "SELECT id, competencia, licencas, emitida_em, vencimento, "
            + "valor_centavos, nota_fiscal_numero, "
            + "IF(status = 'aberta' AND DATE(vencimento) < UTC_DATE(), 'vencida', status) AS status FROM faturas ";

    private final Connection conexao;

    public FaturamentoDAO(Connection conexao) {
        this.conexao = conexao;
    }

    public Contrato contrato() throws SQLException {
        String sql = "SELECT c.numero, c.plano, c.status, c.inicio, c.renovacao, e.licencas_contratadas, "
                + "c.valor_licenca_centavos, c.metodo_pagamento, c.email_nota_fiscal "
                + "FROM contrato c JOIN empresa e ON e.id = c.id WHERE c.id = 1";
        try (Statement st = conexao.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            if (!rs.next()) return null;
            return new Contrato(rs.getString("numero"), rs.getString("plano"), rs.getString("status"),
                    Jdbc.instante(rs, "inicio"), Jdbc.instante(rs, "renovacao"), rs.getInt("licencas_contratadas"),
                    rs.getInt("valor_licenca_centavos"), rs.getString("metodo_pagamento"),
                    rs.getString("email_nota_fiscal"));
        }
    }

    public DadosFiscais dadosFiscais() throws SQLException {
        try (Statement st = conexao.createStatement();
             ResultSet rs = st.executeQuery("SELECT razao_social, cnpj, endereco FROM empresa WHERE id = 1")) {
            return rs.next() ? new DadosFiscais(rs.getString(1), rs.getString(2), rs.getString(3)) : null;
        }
    }

    /** As mais recentes primeiro. */
    public List<Fatura> faturas() throws SQLException {
        return consultar(SELECT_FATURA + "ORDER BY competencia DESC");
    }

    public Fatura fatura(String id) throws SQLException {
        List<Fatura> lista = consultar(SELECT_FATURA + "WHERE id = ?", id);
        return lista.isEmpty() ? null : lista.getFirst();
    }

    /** Soma {@code quantidade} às licenças contratadas e devolve o novo total. */
    public int contratarLicencas(int quantidade) throws SQLException {
        try (PreparedStatement ps = conexao.prepareStatement(
                "UPDATE empresa SET licencas_contratadas = licencas_contratadas + ? WHERE id = 1")) {
            Jdbc.preencher(ps, quantidade);
            ps.executeUpdate();
        }
        try (Statement st = conexao.createStatement();
             ResultSet rs = st.executeQuery("SELECT licencas_contratadas FROM empresa WHERE id = 1")) {
            rs.next();
            return rs.getInt(1);
        }
    }

    private List<Fatura> consultar(String sql, Object... valores) throws SQLException {
        List<Fatura> lista = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, valores);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(new Fatura(rs.getString("id"), Jdbc.instante(rs, "competencia"), rs.getInt("licencas"),
                            Jdbc.instante(rs, "emitida_em"), Jdbc.instante(rs, "vencimento"),
                            rs.getInt("valor_centavos"), rs.getString("status"), rs.getString("nota_fiscal_numero")));
                }
            }
        }
        return lista;
    }
}
