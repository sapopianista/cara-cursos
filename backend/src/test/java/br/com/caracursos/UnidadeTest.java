package br.com.caracursos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

import br.com.caracursos.dao.CertificadoDAO;
import br.com.caracursos.http.Json;
import br.com.caracursos.http.Pagina;
import br.com.caracursos.seguranca.Senhas;
import br.com.caracursos.seguranca.Tokens;
import br.com.caracursos.util.CertificadoPdf;
import br.com.caracursos.util.Csv;

/** Testes que não precisam de banco. */
class UnidadeTest {

    @Test
    void senhaConfereSoComOTextoCerto() {
        String hash = Senhas.gerar("demo1234");
        assertTrue(hash.startsWith("pbkdf2_sha256$600000$"));
        assertTrue(Senhas.verificar("demo1234", hash));
        assertFalse(Senhas.verificar("demo12345", hash));
        assertFalse(Senhas.verificar("demo1234", null));
        assertFalse(Senhas.verificar("demo1234", "texto-qualquer"));
        assertNotEquals(hash, Senhas.gerar("demo1234"), "cada hash usa um salt novo");
    }

    @Test
    void tokenEhAleatorioEOHashEhEstavel() {
        String token = Tokens.novo();
        assertEquals(43, token.length());
        assertNotEquals(token, Tokens.novo());
        assertEquals(Tokens.hash(token), Tokens.hash(token));
        assertEquals(64, Tokens.hash(token).length());
    }

    @Test
    void jsonEscreveNullsEDatasIso() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("quando", Instant.parse("2026-10-30T14:15:00Z"));
        m.put("vazio", null);
        assertEquals("{\"quando\":\"2026-10-30T14:15:00Z\",\"vazio\":null}", Json.escrever(m));
    }

    @Test
    void paginaForaDaFaixaVaiParaOLimite() {
        Pagina.Recorte r = Pagina.recortar(9, 10, 25);
        assertEquals(3, r.pagina());
        assertEquals(3, r.totalPaginas());
        assertEquals(20, r.deslocamento());
        assertEquals(1, Pagina.recortar(0, 10, 0).pagina());
        assertEquals(Pagina.POR_PAGINA_MAXIMO, Pagina.recortar(1, 5000, 10).porPagina());
    }

    @Test
    void csvAbreNoExcelEEvitaFormulas() {
        String texto = new String(new Csv("Nome", "Obs").linha("Ana; Clara", "=SOMA(A1)").linha("Rui", "diz \"oi\"")
                .bytes(), StandardCharsets.UTF_8);
        assertTrue(texto.startsWith("﻿Nome;Obs\r\n"));
        assertTrue(texto.contains("\"Ana; Clara\";'=SOMA(A1)\r\n"));
        assertTrue(texto.contains("Rui;\"diz \"\"oi\"\"\"\r\n"));
    }

    @Test
    void certificadoPdfTemEstruturaValida() {
        CertificadoDAO.Certificado c = new CertificadoDAO.Certificado(1, "Segurança da Informação (LGPD)", "Curso",
                Instant.parse("2026-10-30T14:15:00Z"), "CC-1234-SEG", "/certificados/1/arquivo");
        byte[] pdf = CertificadoPdf.gerar("Ana Clara Silveira", c, "Oscorp");
        String texto = new String(pdf, StandardCharsets.ISO_8859_1);
        assertTrue(texto.startsWith("%PDF-1.4"));
        assertTrue(texto.endsWith("%%EOF\n"));
        assertTrue(texto.contains("(Segurança da Informação \\(LGPD\\)) Tj"), "acentos em WinAnsi e parênteses escapados");
        // O xref aponta para o início de cada objeto.
        int inicioXref = Integer.parseInt(texto.substring(texto.lastIndexOf("startxref\n") + 10, texto.lastIndexOf("\n%%EOF")).trim());
        assertTrue(texto.startsWith("xref", inicioXref));
        String primeiraEntrada = texto.substring(inicioXref).split("\n")[3];
        int posicaoObjeto1 = Integer.parseInt(primeiraEntrada.substring(0, 10));
        assertTrue(texto.startsWith("1 0 obj", posicaoObjeto1));
    }
}
