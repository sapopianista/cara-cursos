package br.com.caracursos.relatorios;

import java.sql.SQLException;
import java.util.List;

import br.com.caracursos.util.TabelaPdf;
import br.com.caracursos.util.TabelaPdf.Coluna;

/** Esqueleto de um relatório PDF em forma de tabela (Template Method, como em {@link RelatorioCsv}). */
abstract class RelatorioPdf implements GeradorRelatorio {

    protected abstract List<Coluna> colunas();

    protected abstract List<List<String>> linhas(ContextoRelatorio contexto) throws SQLException;

    @Override
    public final byte[] gerar(ContextoRelatorio contexto) throws SQLException {
        return TabelaPdf.gerar(contexto.titulo(), contexto.subtitulo(), colunas(), linhas(contexto));
    }
}
