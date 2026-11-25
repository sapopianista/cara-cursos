package br.com.caracursos.relatorios;

import java.sql.SQLException;

/**
 * Padrão Strategy: cada modelo de relatório é um algoritmo diferente para
 * produzir os bytes do arquivo, escolhido em tempo de execução (ver {@link Geradores}).
 * Quem usa a interface não sabe se o resultado é CSV ou PDF.
 */
@FunctionalInterface
public interface GeradorRelatorio {

    byte[] gerar(ContextoRelatorio contexto) throws SQLException;
}
