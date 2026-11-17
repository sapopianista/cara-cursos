package br.com.caracursos.relatorios;

import java.sql.SQLException;

import br.com.caracursos.util.Csv;

/**
 * Classe abstrata com o esqueleto de um relatório CSV (padrão Template Method):
 * {@link #gerar} fixa a ordem dos passos e as subclasses só dizem o cabeçalho
 * e como preencher as linhas.
 */
abstract class RelatorioCsv implements GeradorRelatorio {

    /** Títulos das colunas. */
    protected abstract String[] cabecalho();

    /** Acrescenta ao CSV uma linha por registro do banco. */
    protected abstract void preencher(ContextoRelatorio contexto, Csv csv) throws SQLException;

    @Override
    public final byte[] gerar(ContextoRelatorio contexto) throws SQLException {
        Csv csv = new Csv(cabecalho());
        preencher(contexto, csv);
        return csv.bytes();
    }
}
