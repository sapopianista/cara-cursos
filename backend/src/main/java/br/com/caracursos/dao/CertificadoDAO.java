package br.com.caracursos.dao;

import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.SQLIntegrityConstraintViolationException;
import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Certificados emitidos (tabela {@code certificados}). */
public class CertificadoDAO {

    /** Formato do contrato. {@code url} aponta para o PDF gerado pela própria API. */
    public record Certificado(int id, String titulo, String origem, Instant emitidoEm, String codigo, String url) {
    }

    /** Dados para montar o PDF. */
    public record Emissao(Certificado certificado, String nomeAluno, int idUsuario) {
    }

    private static final SecureRandom ALEATORIO = new SecureRandom();

    private final Connection conexao;

    public CertificadoDAO(Connection conexao) {
        this.conexao = conexao;
    }

    public List<Certificado> doUsuario(int idUsuario) throws SQLException {
        String sql = "SELECT id, titulo, origem, emitido_em, codigo FROM certificados WHERE id_usuario = ? "
                + "ORDER BY emitido_em";
        List<Certificado> lista = new ArrayList<>();
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, idUsuario);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) lista.add(mapear(rs));
            }
        }
        return lista;
    }

    public Emissao buscar(int id) throws SQLException {
        String sql = "SELECT c.id, c.titulo, c.origem, c.emitido_em, c.codigo, c.id_usuario, u.nome "
                + "FROM certificados c JOIN usuarios u ON u.id = c.id_usuario WHERE c.id = ?";
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            Jdbc.preencher(ps, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? new Emissao(mapear(rs), rs.getString("nome"), rs.getInt("id_usuario")) : null;
            }
        }
    }

    /**
     * Emite o certificado se ainda não existir para esta referência
     * ({@code tipo} = curso | nivel). Devolve {@code true} se emitiu agora.
     */
    public boolean emitirSeNovo(int idUsuario, String tipo, int idReferencia, String titulo, String origem,
                                Instant quando) throws SQLException {
        String existe = "SELECT 1 FROM certificados WHERE id_usuario = ? AND tipo = ? AND id_referencia = ?";
        try (PreparedStatement ps = conexao.prepareStatement(existe)) {
            Jdbc.preencher(ps, idUsuario, tipo, idReferencia);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return false;
            }
        }
        String sql = "INSERT INTO certificados (id_usuario, tipo, id_referencia, titulo, origem, codigo, emitido_em) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?)";
        for (int tentativa = 0; ; tentativa++) {
            try (PreparedStatement ps = conexao.prepareStatement(sql)) {
                Jdbc.preencher(ps, idUsuario, tipo, idReferencia, titulo, origem, novoCodigo(titulo), quando);
                ps.executeUpdate();
                return true;
            } catch (SQLIntegrityConstraintViolationException e) {
                // Código sorteado já existe: tenta outro (colisão é rara).
                if (tentativa >= 5) throw e;
            }
        }
    }

    public int contar(int idUsuario) throws SQLException {
        try (PreparedStatement ps = conexao.prepareStatement("SELECT COUNT(*) FROM certificados WHERE id_usuario = ?")) {
            Jdbc.preencher(ps, idUsuario);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }

    /** Ex.: {@code CC-4821-SEG} (4 dígitos sorteados + 3 primeiras letras do título). */
    static String novoCodigo(String titulo) {
        String letras = Normalizer.normalize(titulo, Normalizer.Form.NFD).replaceAll("[^A-Za-z]", "")
                .toUpperCase(Locale.ROOT);
        letras = (letras + "XXX").substring(0, 3);
        return "CC-" + (1000 + ALEATORIO.nextInt(9000)) + "-" + letras;
    }

    private static Certificado mapear(ResultSet rs) throws SQLException {
        int id = rs.getInt("id");
        return new Certificado(id, rs.getString("titulo"), rs.getString("origem"), Jdbc.instante(rs, "emitido_em"),
                rs.getString("codigo"), "/certificados/" + id + "/arquivo");
    }
}
