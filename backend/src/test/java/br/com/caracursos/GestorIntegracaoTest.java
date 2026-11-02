package br.com.caracursos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

/** {@code /admin/gestores} e {@code /admin/auditoria}. Os testes alteram a base, por isso rodam em ordem. */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class GestorIntegracaoTest {

    private final ClienteApi api = new ClienteApi();
    private String admin;

    @BeforeAll
    void prepararBanco() throws Exception {
        BancoDeTeste.recriar();
        admin = api.entrar("tiago.vieira@oscorp.com");
    }

    private JsonObject gestor(int id) {
        for (JsonElement e : api.get("/admin/gestores", admin).getAsJsonArray("gestores")) {
            if (e.getAsJsonObject().get("id").getAsInt() == id) return e.getAsJsonObject();
        }
        return null;
    }

    private static boolean contemId(JsonArray lista, int id) {
        for (JsonElement e : lista) {
            if (e.getAsJsonObject().get("id").getAsInt() == id) return true;
        }
        return false;
    }

    private String ultimaAuditoria() {
        JsonArray lista = api.esperar(200, "GET", "/admin/auditoria", null, admin).getAsJsonArray();
        return lista.get(0).getAsJsonObject().get("descricao").getAsString();
    }

    @Test
    @Order(1)
    void listagemSegueOContrato() {
        JsonObject r = api.get("/admin/gestores", admin);
        assertEquals(5, r.getAsJsonArray("gestores").size());
        assertEquals(4, r.getAsJsonArray("papeis").size());

        JsonObject tiago = gestor(101);
        assertEquals(101, tiago.get("colaboradorId").getAsInt());
        assertEquals("admin", tiago.get("papel").getAsString());
        assertEquals("ativo", tiago.get("status").getAsString());
        assertTrue(tiago.get("mfaAtivo").getAsBoolean());
        assertFalse(tiago.get("ultimoAcesso").isJsonNull());

        // Rodrigo foi convidado depois do último acesso.
        JsonObject rodrigo = gestor(105);
        assertEquals("pendente", rodrigo.get("status").getAsString());
        assertTrue(rodrigo.get("ultimoAcesso").isJsonNull());

        JsonArray candidatos = r.getAsJsonArray("candidatos");
        assertTrue(contemId(candidatos, 102));
        assertFalse(contemId(candidatos, 101), "gestor não é candidato");
        assertFalse(contemId(candidatos, 110), "inativo não é candidato");

        JsonArray auditoria = api.esperar(200, "GET", "/admin/auditoria", null, admin).getAsJsonArray();
        assertEquals(3, auditoria.size());
        assertEquals("Convite enviado", auditoria.get(0).getAsJsonObject().get("acao").getAsString());
    }

    @Test
    @Order(2)
    void soAdministradorAcessa() {
        String rh = api.entrar("beatriz.albuquerque@oscorp.com");
        api.esperar(403, "GET", "/admin/gestores", null, rh);
        api.esperar(403, "GET", "/admin/auditoria", null, rh);
        api.esperar(401, "GET", "/admin/gestores", null, null);
    }

    @Test
    @Order(3)
    void convidarValidaEAceitaAoEntrar() {
        JsonObject invalido = api.esperar(422, "POST", "/admin/gestores",
                Map.of("colaboradorId", 999, "papel", "rei"), admin).getAsJsonObject();
        assertEquals(2, invalido.getAsJsonObject("campos").size());
        api.esperar(422, "POST", "/admin/gestores", Map.of("colaboradorId", 110, "papel", "rh"), admin);
        api.esperar(422, "POST", "/admin/gestores", Map.of("colaboradorId", 103, "papel", "rh"), admin);

        JsonObject ana = api.esperar(200, "POST", "/admin/gestores", Map.of("colaboradorId", 102, "papel", "rh"),
                admin).getAsJsonObject();
        assertEquals("pendente", ana.get("status").getAsString());
        assertEquals("rh", ana.get("papel").getAsString());
        assertEquals("Tiago Vieira convidou Ana Clara Silveira como Gestor de RH.", ultimaAuditoria());

        // O papel vale na hora; ao entrar, o convite conta como aceito.
        String tokenAna = api.entrar("ana.silveira@oscorp.com");
        api.esperar(200, "GET", "/admin/colaboradores/resumo", null, tokenAna);
        assertEquals("ativo", gestor(102).get("status").getAsString());
        api.esperar(409, "POST", "/admin/gestores/102/convite", null, admin);
    }

    @Test
    @Order(4)
    void reenviarConvitePendente() {
        JsonObject rodrigo = api.esperar(200, "POST", "/admin/gestores/105/convite", null, admin).getAsJsonObject();
        assertEquals("pendente", rodrigo.get("status").getAsString());
        assertEquals("Tiago Vieira reenviou o convite de Rodrigo Caetano.", ultimaAuditoria());
        api.esperar(404, "POST", "/admin/gestores/102000/convite", null, admin);
    }

    @Test
    @Order(5)
    void sempreUmAdministradorENinguemRevogaOProprioAcesso() {
        JsonObject proprio = api.esperar(409, "DELETE", "/admin/gestores/101", null, admin).getAsJsonObject();
        assertEquals("PROPRIO_ACESSO", proprio.get("codigo").getAsString());
        JsonObject ultimo = api.esperar(409, "PATCH", "/admin/gestores/101", Map.of("papel", "rh"), admin)
                .getAsJsonObject();
        assertEquals("ULTIMO_ADMIN", ultimo.get("codigo").getAsString());
        api.esperar(422, "PATCH", "/admin/gestores/104", Map.of("papel", "colaborador"), admin);

        // Com um segundo administrador ativo, o primeiro pode deixar de ser.
        api.esperar(200, "PATCH", "/admin/gestores/103", Map.of("papel", "admin"), admin);
        assertEquals("Tiago Vieira definiu Beatriz Albuquerque como Administrador.", ultimaAuditoria());
        String beatriz = api.entrar("beatriz.albuquerque@oscorp.com");
        api.esperar(200, "GET", "/admin/gestores", null, beatriz);
        api.esperar(200, "PATCH", "/admin/gestores/101", Map.of("papel", "rh"), beatriz);
        api.esperar(403, "GET", "/admin/gestores", null, admin);
    }

    @Test
    @Order(6)
    void revogarVoltaASerColaborador() {
        String beatriz = api.entrar("beatriz.albuquerque@oscorp.com");
        String juliana = api.entrar("juliana.mendonca@oscorp.com");
        api.esperar(200, "GET", "/admin/colaboradores/resumo", null, juliana);

        api.esperar(204, "DELETE", "/admin/gestores/104", null, beatriz);
        api.esperar(403, "GET", "/admin/colaboradores/resumo", null, juliana);
        JsonObject r = api.get("/admin/gestores", beatriz);
        assertTrue(contemId(r.getAsJsonArray("candidatos"), 104));
        assertEquals("colaborador", api.get("/auth/me", juliana).get("papel").getAsString());
        api.esperar(404, "DELETE", "/admin/gestores/104", null, beatriz);
    }
}
