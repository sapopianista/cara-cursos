package br.com.caracursos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import com.google.gson.JsonObject;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ConfiguracaoIntegracaoTest {

    private final ClienteApi api = new ClienteApi();
    private String admin;

    @BeforeAll
    void prepararBanco() throws Exception {
        BancoDeTeste.recriar();
        admin = api.entrar("tiago.vieira@oscorp.com");
    }

    @Test
    void leValidaESalva() {
        JsonObject atual = api.get("/admin/configuracoes", admin);
        JsonObject org = atual.getAsJsonObject("organizacao");
        assertEquals("11.222.333/0001-81", org.get("cnpj").getAsString());
        assertEquals("oscorp.com, lab.oscorp.com", org.get("dominiosAutorizados").getAsString());
        assertTrue(atual.getAsJsonObject("politicas").get("exigir2FA").getAsBoolean());

        JsonObject invalido = api.esperar(422, "PUT", "/admin/configuracoes", Map.of(
                "organizacao", Map.of("nomeFantasia", "", "razaoSocial", "Oscorp", "cnpj", "11.222.333/0001-82",
                        "emailNotificacao", "x@", "fusoHorario", "Marte/Olimpo", "dominiosAutorizados", "oscorp"),
                "politicas", Map.of()), admin).getAsJsonObject();
        assertEquals(5, invalido.getAsJsonObject("campos").size());

        JsonObject salvo = api.esperar(200, "PUT", "/admin/configuracoes", Map.of(
                "organizacao", Map.of("nomeFantasia", "Oscorp Labs", "razaoSocial", "Oscorp Brasil Ltda.",
                        "cnpj", "11222333000181", "emailNotificacao", "RH@Oscorp.com", "fusoHorario", "America/Manaus",
                        "dominiosAutorizados", "Oscorp.com,lab.oscorp.com, oscorp.com"),
                "politicas", Map.of("exigirPresencaMinima", false, "certificacaoAutomatica", true,
                        "permitirDownloadMateriais", true, "exigir2FA", false)), admin).getAsJsonObject();
        JsonObject novaOrg = salvo.getAsJsonObject("organizacao");
        assertEquals("11.222.333/0001-81", novaOrg.get("cnpj").getAsString());
        assertEquals("rh@oscorp.com", novaOrg.get("emailNotificacao").getAsString());
        assertEquals("oscorp.com, lab.oscorp.com", novaOrg.get("dominiosAutorizados").getAsString());
        assertFalse(salvo.getAsJsonObject("politicas").get("exigirPresencaMinima").getAsBoolean());

        assertEquals("America/Manaus", api.get("/admin/configuracoes", admin).getAsJsonObject("organizacao")
                .get("fusoHorario").getAsString());
        // O nome fantasia aparece na sessão de todos.
        assertEquals("Oscorp Labs", api.get("/auth/me", admin).getAsJsonObject("empresa").get("nome").getAsString());
        JsonObject auditoria = api.esperar(200, "GET", "/admin/auditoria", null, admin).getAsJsonArray().get(0)
                .getAsJsonObject();
        assertEquals("Configurações alteradas", auditoria.get("acao").getAsString());
    }

    @Test
    void soAdminERh() {
        api.esperar(200, "GET", "/admin/configuracoes", null, api.entrar("beatriz.albuquerque@oscorp.com"));
        api.esperar(403, "GET", "/admin/configuracoes", null, api.entrar("juliana.mendonca@oscorp.com"));
        api.esperar(403, "PUT", "/admin/configuracoes", Map.of(), api.entrar("ana.silveira@oscorp.com"));
    }
}
