package br.com.caracursos.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import br.com.caracursos.model.Usuario;
import br.com.caracursos.seguranca.Tokens;

/** Sessões de login (tabela {@code sessoes}). Só o hash do token é guardado. */
public class SessaoDAO {

    private final Connection conexao;

    public SessaoDAO(Connection conexao) {
        this.conexao = conexao;
    }

    public void criar(String token, int idUsuario, Instant criadaEm, Instant expiraEm) throws SQLException {
        String sql = "INSERT INTO sessoes (token_hash, id_usuario, criada_em, expira_em) VALUES (?, ?, ?, ?)";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, Tokens.hash(token), idUsuario, criadaEm, expiraEm);
            ps.executeUpdate();
        }
    }

    /** Usuário dono do token, se a sessão é válida e o acesso não foi desativado; senão {@code null}. */
    public Usuario buscarUsuarioAtivo(String token) throws SQLException {
        String sql = "SELECT " + UsuarioDAO.COLUNAS + " FROM sessoes s JOIN usuarios u ON u.id = s.id_usuario "
                + "WHERE s.token_hash = ? AND s.revogada_em IS NULL AND s.expira_em > ? AND u.status <> 'inativo'";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, Tokens.hash(token), Jdbc.agora());
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? UsuarioDAO.mapear(rs) : null;
            }
        }
    }

    public void revogar(String token) throws SQLException {
        String sql = "UPDATE sessoes SET revogada_em = ? WHERE token_hash = ? AND revogada_em IS NULL";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, Jdbc.agora(), Tokens.hash(token));
            ps.executeUpdate();
        }
    }

    /** Encerra todas as sessões abertas de um usuário (ex.: ao desativar o acesso). */
    public void revogarTodas(int idUsuario) throws SQLException {
        String sql = "UPDATE sessoes SET revogada_em = ? WHERE id_usuario = ? AND revogada_em IS NULL";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, Jdbc.agora(), idUsuario);
            ps.executeUpdate();
        }
    }

    /**
     * Quantidade de logins por hora do dia (0–23), no fuso informado como
     * deslocamento em horas (ex.: -3 para Brasília), desde {@code desde}.
     */
    public Map<Integer, Integer> contarPorHora(Instant desde, int deslocamentoHoras) throws SQLException {
        String sql = "SELECT HOUR(DATE_ADD(criada_em, INTERVAL ? HOUR)) AS hora, COUNT(*) AS total "
                + "FROM sessoes WHERE criada_em >= ? GROUP BY hora";
        Map<Integer, Integer> porHora = new LinkedHashMap<>();
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, deslocamentoHoras, desde);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) porHora.put(rs.getInt("hora"), rs.getInt("total"));
            }
        }
        return porHora;
    }
}
