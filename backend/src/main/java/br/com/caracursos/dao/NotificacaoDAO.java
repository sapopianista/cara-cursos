package br.com.caracursos.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** Notificações do usuário (tabela {@code notificacoes}). */
public class NotificacaoDAO {

    public record Notificacao(int id, String titulo, String descricao, String link, boolean lida, Instant criadaEm) {
    }

    private static final int LIMITE = 50;

    private final Connection conexao;

    public NotificacaoDAO(Connection conexao) {
        this.conexao = conexao;
    }

    /** As mais recentes primeiro. */
    public List<Notificacao> listar(int idUsuario) throws SQLException {
        String sql = "SELECT id, titulo, descricao, link, lida, criada_em FROM notificacoes WHERE id_usuario = ? "
                + "ORDER BY criada_em DESC, id DESC LIMIT ?";
        List<Notificacao> lista = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, idUsuario, LIMITE);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(new Notificacao(rs.getInt("id"), rs.getString("titulo"), rs.getString("descricao"),
                            rs.getString("link"), rs.getBoolean("lida"), Jdbc.instante(rs, "criada_em")));
                }
            }
        }
        return lista;
    }

    public void criar(int idUsuario, String titulo, String descricao, String link, Instant quando) throws SQLException {
        String sql = "INSERT INTO notificacoes (id_usuario, titulo, descricao, link, criada_em) VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, idUsuario, titulo, descricao, link, quando);
            ps.executeUpdate();
        }
    }

    /** Só marca se a notificação for do próprio usuário. */
    public void marcarLida(int id, int idUsuario) throws SQLException {
        try (PreparedStatement ps = conexao.prepareStatement(
                "UPDATE notificacoes SET lida = TRUE WHERE id = ? AND id_usuario = ?")) {
            Jdbc.preencher(ps, id, idUsuario);
            ps.executeUpdate();
        }
    }

    public void marcarTodasLidas(int idUsuario) throws SQLException {
        try (PreparedStatement ps = conexao.prepareStatement(
                "UPDATE notificacoes SET lida = TRUE WHERE id_usuario = ? AND NOT lida")) {
            Jdbc.preencher(ps, idUsuario);
            ps.executeUpdate();
        }
    }
}
