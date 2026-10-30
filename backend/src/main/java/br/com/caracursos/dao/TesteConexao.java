package br.com.caracursos.dao;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Verificação manual da conexão: abre uma conexão pela {@link ConexaoFactory}
 * e conta os registros de cada tabela.
 */
public final class TesteConexao {

    private static final String[] TABELAS = { "usuarios", "cursos", "aulas", "matriculas", "certificados" };

    private TesteConexao() {
    }

    public static void main(String[] args) {
        try (Connection conexao = ConexaoFactory.getConexao();
             Statement comando = conexao.createStatement()) {
            System.out.println("Conectado a " + conexao.getMetaData().getURL());
            for (String tabela : TABELAS) {
                try (ResultSet rs = comando.executeQuery("SELECT COUNT(*) FROM " + tabela)) {
                    rs.next();
                    System.out.println("  " + tabela + ": " + rs.getInt(1) + " registros");
                }
            }
        } catch (SQLException e) {
            System.err.println("Falha na conexão: " + e.getMessage());
            System.exit(1);
        }
    }
}
