package br.com.caracursos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import br.com.caracursos.http.Api;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class RelatorioIntegracaoTest {

    private final ClienteApi api = new ClienteApi();
    private String admin;

    @BeforeAll
    void prepararBanco() throws Exception {
        BancoDeTeste.recriar();
        admin = api.entrar("tiago.vieira@oscorp.com");
    }

    private JsonObject gerar(String modelo, String periodo, String departamento) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("modeloId", modelo);
        corpo.put("periodo", periodo);
        corpo.put("departamento", departamento);
        return api.esperar(200, "POST", "/admin/relatorios", corpo, admin).getAsJsonObject();
    }

    private Api.Resposta baixar(JsonObject relatorio) {
        Api.Resposta r = api.chamar("GET", relatorio.get("url").getAsString(), null, admin);
        assertEquals(200, r.status(), r::texto);
        return r;
    }

    @Test
    void listaModelosEDepartamentos() {
        JsonObject r = api.get("/admin/relatorios", admin);
        assertEquals(6, r.getAsJsonArray("modelos").size());
        assertEquals(7, r.getAsJsonArray("departamentos").size());
    }

    @Test
    void geraCadaModeloEBaixaOArquivo() {
        for (JsonElement e : api.get("/admin/relatorios", admin).getAsJsonArray("modelos")) {
            JsonObject modelo = e.getAsJsonObject();
            JsonObject gerado = gerar(modelo.get("id").getAsString(), "ano", null);
            assertEquals("pronto", gerado.get("status").getAsString());
            assertEquals("Tiago Vieira", gerado.get("solicitadoPor").getAsString());
            assertEquals(modelo, gerado.getAsJsonObject("modelo"));

            Api.Resposta arquivo = baixar(gerado);
            String formato = modelo.get("formato").getAsString();
            String disposicao = arquivo.cabecalhos().get("Content-Disposition");
            assertTrue(disposicao.endsWith("." + formato + "\""), disposicao);
            if (formato.equals("pdf")) {
                assertTrue(new String(arquivo.corpo(), 0, 8, StandardCharsets.ISO_8859_1).startsWith("%PDF-1.4"));
            } else {
                assertTrue(arquivo.texto().lines().count() > 1, "CSV com dados: " + modelo.get("id"));
            }
        }
    }

    @Test
    void filtroDeDepartamentoEConteudo() {
        String csv = baixar(gerar("engajamento", "30dias", "Marketing")).texto();
        assertTrue(csv.startsWith("﻿Matrícula;Nome;Departamento;"));
        csv.lines().skip(1).forEach(l -> assertTrue(l.contains(";Marketing;"), l));

        String conformidade = baixar(gerar("conformidade", "30dias", null)).texto();
        assertTrue(conformidade.contains("Fundamentos da Cultura Oscorp"));
        assertTrue(conformidade.contains("Não iniciado") || conformidade.contains("Concluído"));

        // O histórico mostra os mais recentes primeiro, com o filtro escolhido.
        JsonArray historico = api.get("/admin/relatorios", admin).getAsJsonArray("historico");
        JsonObject recente = historico.get(0).getAsJsonObject();
        assertEquals("conformidade", recente.get("modeloId").getAsString());
        assertTrue(recente.get("departamento").isJsonNull());
    }

    @Test
    void validaEProtege() {
        JsonObject invalido = api.esperar(422, "POST", "/admin/relatorios",
                Map.of("modeloId", "inexistente", "periodo", "seculo", "departamento", "Astronomia"), admin)
                .getAsJsonObject();
        assertEquals(3, invalido.getAsJsonObject("campos").size());
        api.esperar(404, "GET", "/admin/relatorios/999999/arquivo", null, admin);

        String aluna = api.entrar("ana.silveira@oscorp.com");
        api.esperar(403, "GET", "/admin/relatorios", null, aluna);
        api.esperar(403, "POST", "/admin/relatorios", Map.of("modeloId", "conclusao", "periodo", "ano"), aluna);
        String financeiro = api.entrar("rodrigo.caetano@oscorp.com");
        api.esperar(403, "GET", "/admin/relatorios", null, financeiro);
    }
}
