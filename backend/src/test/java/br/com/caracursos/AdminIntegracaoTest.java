package br.com.caracursos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import br.com.caracursos.http.Api;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AdminIntegracaoTest {

    private final ClienteApi api = new ClienteApi();
    private String admin;

    @BeforeAll
    void prepararBanco() throws Exception {
        BancoDeTeste.recriar();
        admin = api.entrar("tiago.vieira@oscorp.com");
    }

    private static Map<String, Object> novo(String nome, String email) {
        return Map.of("nome", nome, "email", email, "cargo", "Estagiário", "departamento", "Tecnologia", "nivel", 1);
    }

    @Test
    void listagemComFiltrosEResumo() {
        JsonObject pagina = api.get("/admin/colaboradores?porPagina=10", admin);
        assertEquals(10, pagina.getAsJsonArray("itens").size());
        JsonObject primeiro = pagina.getAsJsonArray("itens").get(0).getAsJsonObject();
        for (String campo : new String[] { "matricula", "progresso", "cursosConcluidos", "status", "ultimoAcesso", "criadoEm" }) {
            assertTrue(primeiro.has(campo), campo);
        }
        for (JsonElement e : api.get("/admin/colaboradores?status=inativo", admin).getAsJsonArray("itens")) {
            assertEquals("inativo", e.getAsJsonObject().get("status").getAsString());
        }
        assertEquals(1, api.get("/admin/colaboradores?busca=silveira", admin).get("total").getAsInt());

        JsonObject opcoes = api.get("/admin/colaboradores/opcoes", admin);
        assertEquals(7, opcoes.getAsJsonArray("departamentos").size());
        JsonObject resumo = api.get("/admin/colaboradores/resumo", admin);
        assertEquals(30, resumo.getAsJsonObject("licencas").get("contratadas").getAsInt());
        assertTrue(resumo.get("conclusaoMedia").getAsInt() > 0);
    }

    @Test
    void cadastroValidaEmailUnicoELicencas() {
        JsonObject duplicado = api.esperar(422, "POST", "/admin/colaboradores",
                novo("Outra Ana", "ANA.SILVEIRA@oscorp.com"), admin).getAsJsonObject();
        assertEquals("Já existe um colaborador com este e-mail.",
                duplicado.getAsJsonObject("campos").get("email").getAsString());
        JsonObject invalido = api.esperar(422, "POST", "/admin/colaboradores",
                Map.of("nome", "", "email", "x", "cargo", "Astronauta"), admin).getAsJsonObject();
        assertEquals(4, invalido.getAsJsonObject("campos").size());

        JsonObject criado = api.esperar(200, "POST", "/admin/colaboradores",
                novo("Nova Pessoa", "nova.pessoa@oscorp.com"), admin).getAsJsonObject();
        assertEquals("pendente", criado.get("status").getAsString());
        assertTrue(criado.get("matricula").getAsString().matches("COL-\\d{4}"));

        JsonObject editado = api.esperar(200, "PUT", "/admin/colaboradores/" + criado.get("id").getAsInt(),
                Map.of("nome", "Nova Pessoa Silva", "email", "nova.pessoa@oscorp.com", "cargo", "Recrutadora",
                        "departamento", "Recursos Humanos", "nivel", 2), admin).getAsJsonObject();
        assertEquals("Recursos Humanos", editado.get("departamento").getAsString());

        // Preenche as licenças restantes; a seguinte é recusada com SEM_LICENCAS.
        JsonObject licencas = api.get("/admin/colaboradores/resumo", admin).getAsJsonObject("licencas");
        int livres = licencas.get("contratadas").getAsInt() - licencas.get("emUso").getAsInt();
        for (int i = 0; i < livres; i++) {
            api.esperar(200, "POST", "/admin/colaboradores", novo("Pessoa " + i, "pessoa" + i + "@oscorp.com"), admin);
        }
        JsonObject cheio = api.esperar(409, "POST", "/admin/colaboradores", novo("Excedente", "excedente@oscorp.com"),
                admin).getAsJsonObject();
        assertEquals("SEM_LICENCAS", cheio.get("codigo").getAsString());
        // Reativar alguém também precisa de licença livre.
        api.esperar(409, "PATCH", "/admin/colaboradores/110/status", Map.of("status", "ativo"), admin);
    }

    @Test
    void desativarEncerraAsSessoes() {
        String vanessa = api.entrar("vanessa.lopes@oscorp.com");
        JsonObject r = api.esperar(200, "PATCH", "/admin/colaboradores/124/status", Map.of("status", "inativo"), admin)
                .getAsJsonObject();
        assertEquals("inativo", r.get("status").getAsString());
        api.esperar(401, "GET", "/auth/me", null, vanessa);
        api.esperar(409, "PATCH", "/admin/colaboradores/101/status", Map.of("status", "inativo"), admin);
        api.esperar(422, "PATCH", "/admin/colaboradores/101/status", Map.of("status", "banido"), admin);
        api.esperar(404, "PATCH", "/admin/colaboradores/9999/status", Map.of("status", "inativo"), admin);
    }

    @Test
    void progressoDoColaboradorEExportacao() {
        JsonObject p = api.get("/admin/colaboradores/101/progresso", admin);
        assertEquals("Tiago Vieira", p.getAsJsonObject("colaborador").get("nome").getAsString());
        assertEquals(7, p.getAsJsonArray("cursos").size());
        assertNotNull(p.getAsJsonArray("cursos").get(0).getAsJsonObject().getAsJsonObject("curso").get("titulo"));

        Api.Resposta csv = api.chamar("GET", "/admin/colaboradores/exportar?status=ativo", null, admin);
        assertEquals(200, csv.status());
        String texto = new String(csv.corpo(), StandardCharsets.UTF_8);
        assertTrue(texto.startsWith("﻿Matrícula;Nome;E-mail;"));
        assertTrue(texto.contains("COL-0101;Tiago Vieira;tiago.vieira@oscorp.com;"));
        assertTrue(csv.cabecalhos().get("Content-Disposition").contains("colaboradores-"));
    }

    @Test
    void painelSomaTurnosEm100() {
        for (String periodo : new String[] { "7dias", "30dias", "trimestre", "invalido" }) {
            JsonObject d = api.get("/admin/dashboard?periodo=" + periodo, admin);
            int soma = 0;
            for (JsonElement s : d.getAsJsonObject("sessoesPorTurno").getAsJsonArray("segmentos")) {
                soma += s.getAsJsonObject().get("percentual").getAsInt();
            }
            assertEquals(100, soma, periodo);
            int engajamento = d.getAsJsonObject("indicadores").get("engajamento").getAsInt();
            assertTrue(engajamento >= 0 && engajamento <= 100);
            assertTrue(d.getAsJsonObject("atividadeRecente").getAsJsonArray("colaboradores").size() <= 5);
        }
    }
}
