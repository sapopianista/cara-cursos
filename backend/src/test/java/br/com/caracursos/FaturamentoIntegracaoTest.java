package br.com.caracursos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import br.com.caracursos.http.Api;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class FaturamentoIntegracaoTest {

    private final ClienteApi api = new ClienteApi();
    private String admin;

    @BeforeAll
    void prepararBanco() throws Exception {
        BancoDeTeste.recriar();
        admin = api.entrar("tiago.vieira@oscorp.com");
    }

    @Test
    void resumoSegueOContrato() {
        JsonObject r = api.get("/admin/faturamento", admin);
        JsonObject contrato = r.getAsJsonObject("contrato");
        assertEquals("OSC-2026-008", contrato.get("numero").getAsString());
        assertEquals(7400, contrato.get("valorLicencaMensalCentavos").getAsInt());
        assertTrue(contrato.get("renovacao").getAsString().endsWith("Z"), "datas em ISO 8601 UTC");

        JsonObject licencas = r.getAsJsonObject("licencas");
        assertEquals(contrato.get("licencasContratadas").getAsInt(), licencas.get("contratadas").getAsInt());
        assertTrue(licencas.get("emUso").getAsInt() > 0);
        assertEquals(licencas.get("contratadas").getAsInt() * 7400,
                r.getAsJsonObject("proximaFatura").get("valorCentavos").getAsInt());
        assertEquals("11.222.333/0001-81", r.getAsJsonObject("dadosFiscais").get("cnpj").getAsString());

        JsonArray faturas = r.getAsJsonArray("faturas");
        assertEquals(4, faturas.size());
        JsonObject recente = faturas.get(0).getAsJsonObject();
        assertTrue(recente.get("id").getAsString().matches("INV-\\d{4}-\\d{2}"));
        String status = recente.get("status").getAsString();
        assertTrue(status.equals("aberta") || status.equals("vencida"), status);
        assertEquals("paga", faturas.get(3).getAsJsonObject().get("status").getAsString());
        assertEquals(25 * 7400, faturas.get(3).getAsJsonObject().get("valorCentavos").getAsInt());
    }

    @Test
    void demonstrativoEmPdf() {
        JsonObject fatura = api.get("/admin/faturamento", admin).getAsJsonArray("faturas").get(1).getAsJsonObject();
        JsonObject nota = fatura.getAsJsonObject("notaFiscal");
        Api.Resposta r = api.chamar("GET", nota.get("url").getAsString(), null, admin);
        assertEquals(200, r.status(), r::texto);
        assertEquals("application/pdf", r.tipoConteudo());
        assertTrue(r.cabecalhos().get("Content-Disposition").contains(nota.get("numero").getAsString() + ".pdf"));
        String pdf = new String(r.corpo(), StandardCharsets.ISO_8859_1);
        assertTrue(pdf.startsWith("%PDF-1.4"));
        assertTrue(pdf.contains("Documento sem valor fiscal"));

        api.esperar(404, "GET", "/admin/faturamento/faturas/INV-1999-01/nota", null, admin);
        api.esperar(404, "GET", "/admin/faturamento/faturas/qualquer/nota", null, admin);
    }

    @Test
    void contratarLicencasLiberaCadastros() {
        JsonObject antes = api.get("/admin/faturamento", admin).getAsJsonObject("licencas");
        int contratadas = antes.get("contratadas").getAsInt();

        JsonObject invalido = api.esperar(422, "POST", "/admin/faturamento/licencas", Map.of("quantidade", 0), admin)
                .getAsJsonObject();
        assertEquals("Entre 1 e 500.", invalido.getAsJsonObject("campos").get("quantidade").getAsString());
        api.esperar(422, "POST", "/admin/faturamento/licencas", Map.of("quantidade", 501), admin);
        api.esperar(422, "POST", "/admin/faturamento/licencas", Map.of("quantidade", "dez"), admin);

        JsonObject r = api.esperar(200, "POST", "/admin/faturamento/licencas", Map.of("quantidade", 5), admin)
                .getAsJsonObject();
        assertEquals(contratadas + 5, r.get("licencasContratadas").getAsInt());
        // O mesmo número limita o cadastro de colaboradores.
        assertEquals(contratadas + 5, api.get("/admin/colaboradores/resumo", admin).getAsJsonObject("licencas")
                .get("contratadas").getAsInt());
        JsonObject auditoria = api.esperar(200, "GET", "/admin/auditoria", null, admin).getAsJsonArray().get(0)
                .getAsJsonObject();
        assertEquals("Licenças contratadas", auditoria.get("acao").getAsString());
    }

    @Test
    void soAdminEFinanceiro() {
        api.esperar(200, "GET", "/admin/faturamento", null, api.entrar("rodrigo.caetano@oscorp.com"));
        api.esperar(403, "GET", "/admin/faturamento", null, api.entrar("beatriz.albuquerque@oscorp.com"));
        api.esperar(403, "POST", "/admin/faturamento/licencas", Map.of("quantidade", 1),
                api.entrar("ana.silveira@oscorp.com"));
    }
}
