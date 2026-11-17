package br.com.caracursos.relatorios;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.List;

import org.junit.jupiter.api.Test;

import br.com.caracursos.util.Csv;
import br.com.caracursos.util.TabelaPdf.Coluna;

class GeradoresTest {

    @Test
    void todosOsModelosTemGerador() {
        for (String id : List.of("engajamento", "conclusao", "horas", "satisfacao", "individual", "conformidade")) {
            assertNotNull(Geradores.de(id), id);
        }
        assertNull(Geradores.de("inexistente"));
    }

    @Test
    void templateCsvMontaCabecalhoELinhas() throws SQLException {
        GeradorRelatorio g = new RelatorioCsv() {
            @Override
            protected String[] cabecalho() {
                return new String[] { "A", "B" };
            }

            @Override
            protected void preencher(ContextoRelatorio contexto, Csv csv) {
                csv.linha(1, "x");
            }
        };
        String texto = new String(g.gerar(new ContextoRelatorio(null, null, null, "t", "s")), StandardCharsets.UTF_8);
        assertEquals("﻿A;B\r\n1;x\r\n", texto);
    }

    @Test
    void templatePdfGeraDocumentoPdf() throws SQLException {
        GeradorRelatorio g = new RelatorioPdf() {
            @Override
            protected List<Coluna> colunas() {
                return List.of(new Coluna("Nome", 1, false));
            }

            @Override
            protected List<List<String>> linhas(ContextoRelatorio contexto) {
                return List.of(List.of("Ana"));
            }
        };
        byte[] pdf = g.gerar(new ContextoRelatorio(null, null, null, "Titulo", "Sub"));
        assertTrue(new String(pdf, 0, 5, StandardCharsets.ISO_8859_1).startsWith("%PDF"));
    }
}
