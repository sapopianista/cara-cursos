package br.com.caracursos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.Map;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import com.google.gson.JsonObject;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AuthIntegracaoTest {

    private final ClienteApi api = new ClienteApi();

    @BeforeAll
    void prepararBanco() throws Exception {
        BancoDeTeste.recriar();
    }

    private JsonObject login(int status, String email, String senha) {
        return api.esperar(status, "POST", "/auth/login", Map.of("identificador", email, "senha", senha), null)
                .getAsJsonObject();
    }

    @Test
    void loginDevolveTokenEUsuarioNoFormatoDoContrato() {
        JsonObject r = login(200, "  Tiago.Vieira@OSCORP.com ", "demo1234");
        assertNotNull(r.get("token").getAsString());
        JsonObject u = r.getAsJsonObject("usuario");
        assertEquals(101, u.get("id").getAsInt());
        assertEquals("admin", u.get("papel").getAsString());
        assertEquals("Oscorp", u.getAsJsonObject("empresa").get("nome").getAsString());
        assertEquals(null, u.get("senha"), "a senha nunca sai da API");
    }

    @Test
    void credenciaisErradasUsamAMesmaMensagem() {
        JsonObject senhaErrada = login(401, "tiago.vieira@oscorp.com", "errada");
        JsonObject emailInexistente = login(401, "ninguem@oscorp.com", "demo1234");
        assertEquals(senhaErrada.get("mensagem"), emailInexistente.get("mensagem"));
        assertEquals("CREDENCIAIS_INVALIDAS", senhaErrada.get("codigo").getAsString());
        // Convite pendente ainda não tem senha.
        login(401, "maria.santos@oscorp.com", "demo1234");
    }

    @Test
    void acessoDesativadoE403() {
        assertEquals("Seu acesso está desativado. Fale com o RH da sua empresa.",
                login(403, "felipe.barreto@oscorp.com", "demo1234").get("mensagem").getAsString());
    }

    @Test
    void camposVaziosSao422ComErroPorCampo() {
        JsonObject r = api.esperar(422, "POST", "/auth/login", Map.of("identificador", " "), null).getAsJsonObject();
        assertNotNull(r.getAsJsonObject("campos").get("identificador"));
        assertNotNull(r.getAsJsonObject("campos").get("senha"));
        api.esperar(400, "POST", "/auth/login", "{ nao é json", null);
    }

    @Test
    void sessaoValeAteOLogout() {
        String token = api.entrar("ana.silveira@oscorp.com");
        assertEquals("colaborador", api.get("/auth/me", token).get("papel").getAsString());
        api.esperar(204, "POST", "/auth/logout", null, token);
        assertEquals("SESSAO_EXPIRADA",
                api.esperar(401, "GET", "/auth/me", null, token).getAsJsonObject().get("codigo").getAsString());
        api.esperar(401, "GET", "/cursos", null, null);
        api.esperar(401, "GET", "/cursos", null, "token-inventado");
    }

    @Test
    void colaboradorNaoEntraNoPainelDaEmpresa() {
        String ana = api.entrar("ana.silveira@oscorp.com");
        api.esperar(403, "GET", "/admin/dashboard", null, ana);
        api.esperar(403, "GET", "/admin/colaboradores", null, ana);
        api.esperar(200, "GET", "/admin/dashboard", null, api.entrar("beatriz.albuquerque@oscorp.com"));
    }

    @Test
    void rotasDesconhecidasRespondemJson() {
        assertEquals("NAO_ENCONTRADO",
                api.esperar(404, "GET", "/nao-existe", null, null).getAsJsonObject().get("codigo").getAsString());
        api.esperar(405, "DELETE", "/cursos", null, null);
        assertEquals("ok", api.get("/saude", null).get("status").getAsString());
    }
}
