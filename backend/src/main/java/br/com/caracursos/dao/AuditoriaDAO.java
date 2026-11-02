package br.com.caracursos.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import br.com.caracursos.model.Usuario;

/** Registro das alterações de acesso (tabela {@code auditoria}). */
public class AuditoriaDAO {

    public record Registro(int id, String acao, String descricao, String autor, Instant criadoEm) {
    }

    private final Connection conexao;

    public AuditoriaDAO(Connection conexao) {
        this.conexao = conexao;
    }

    /** Os mais recentes primeiro. */
    public List<Registro> ultimos(int limite) throws SQLException {
        String sql = "SELECT id, acao, descricao, autor, criado_em FROM auditoria ORDER BY criado_em DESC, id DESC LIMIT ?";
        List<Registro> lista = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, limite);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(new Registro(rs.getInt("id"), rs.getString("acao"), rs.getString("descricao"),
                            rs.getString("autor"), Jdbc.instante(rs, "criado_em")));
                }
            }
        }
        return lista;
    }

    /** {@code descricao} completa a frase que começa com o nome do autor (ex.: "convidou Ana como RH."). */
    public void registrar(Usuario autor, String acao, String descricao) throws SQLException {
        String sql = "INSERT INTO auditoria (acao, descricao, id_autor, autor, criado_em) VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, acao, autor.getNome() + " " + descricao, autor.getId(), autor.getNome(), Jdbc.agora());
            ps.executeUpdate();
        }
    }
}
