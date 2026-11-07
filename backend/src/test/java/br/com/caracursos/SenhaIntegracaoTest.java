package br.com.caracursos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import com.google.gson.JsonObject;

/** Senha inicial definida pelo RH, troca obrigatória no primeiro acesso e redefinição de senha. */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SenhaIntegracaoTest {

    private final ClienteApi api = new ClienteApi();
    private String admin;

    @BeforeAll
    void prepararBanco() throws Exception {
        BancoDeTeste.recriar();
        admin = api.entrar("tiago.vieira@oscorp.com");
    }

    private int cadastrar(String email, String senha) {
        return api.esperar(200, "POST", "/admin/colaboradores", Map.of("nome", "Pessoa Nova", "email", email,
                "cargo", "Estagiário", "departamento", "Tecnologia", "senhaInicial", senha), admin)
                .getAsJsonObject().get("id").getAsInt();
    }

    private JsonObject login(int status, String email, String senha) {
        return api.esperar(status, "POST", "/auth/login", Map.of("identificador", email, "senha", senha), null)
                .getAsJsonObject();
    }

    @Test
    void primeiroAcessoExigeTrocarASenha() {
        int id = cadastrar("primeiro.acesso@oscorp.com", "provisoria123");
        assertEquals("pendente", api.get("/admin/colaboradores/" + id + "/progresso", admin)
                .getAsJsonObject("colaborador").get("status").getAsString());

        JsonObject entrada = login(200, "primeiro.acesso@oscorp.com", "provisoria123");
        String token = entrada.get("token").getAsString();
        assertTrue(entrada.getAsJsonObject("usuario").get("trocarSenha").getAsBoolean());
        assertEquals("ativo", api.get("/admin/colaboradores/" + id + "/progresso", admin)
                .getAsJsonObject("colaborador").get("status").getAsString(), "o primeiro acesso ativa a conta");

        // Antes de trocar a senha, só a sessão, a troca e o logout funcionam.
        JsonObject bloqueado = api.esperar(403, "GET", "/alunos/me/inicio", null, token).getAsJsonObject();
        assertEquals("TROCAR_SENHA", bloqueado.get("codigo").getAsString());
        assertTrue(api.get("/auth/me", token).get("trocarSenha").getAsBoolean());

        JsonObject invalido = api.esperar(422, "PUT", "/auth/senha",
                Map.of("senhaAtual", "errada", "novaSenha", "curta"), token).getAsJsonObject();
        assertEquals(2, invalido.getAsJsonObject("campos").size());
        api.esperar(422, "PUT", "/auth/senha", Map.of("senhaAtual", "provisoria123", "novaSenha", "provisoria123"),
                token);

        JsonObject trocada = api.esperar(200, "PUT", "/auth/senha",
                Map.of("senhaAtual", "provisoria123", "novaSenha", "minha-senha-forte"), token).getAsJsonObject();
        assertFalse(trocada.get("trocarSenha").getAsBoolean());
        api.esperar(200, "GET", "/alunos/me/inicio", null, token);

        login(401, "primeiro.acesso@oscorp.com", "provisoria123");
        assertFalse(login(200, "primeiro.acesso@oscorp.com", "minha-senha-forte").getAsJsonObject("usuario")
                .get("trocarSenha").getAsBoolean());
    }

    @Test
    void senhaInicialSegueARegra() {
        JsonObject r = api.esperar(422, "POST", "/admin/colaboradores", Map.of("nome", "Sem Senha",
                "email", "sem.senha@oscorp.com", "cargo", "Estagiário", "departamento", "Tecnologia"), admin)
                .getAsJsonObject();
        assertEquals("Informe a senha.", r.getAsJsonObject("campos").get("senhaInicial").getAsString());
        api.esperar(422, "POST", "/admin/colaboradores", Map.of("nome", "Curta", "email", "curta@oscorp.com",
                "cargo", "Estagiário", "departamento", "Tecnologia", "senhaInicial", "1234567"), admin);
    }

    @Test
    void redefinirSenhaEncerraSessoesEPedeTroca() {
        String vanessa = api.entrar("vanessa.lopes@oscorp.com");
        String rh = api.entrar("beatriz.albuquerque@oscorp.com");
        api.esperar(204, "PUT", "/admin/colaboradores/124/senha", Map.of("senha", "nova-provisoria"), rh);

        api.esperar(401, "GET", "/auth/me", null, vanessa);
        login(401, "vanessa.lopes@oscorp.com", "demo1234");
        assertTrue(login(200, "vanessa.lopes@oscorp.com", "nova-provisoria").getAsJsonObject("usuario")
                .get("trocarSenha").getAsBoolean());
        assertEquals("Senha redefinida", api.esperar(200, "GET", "/admin/auditoria", null, admin).getAsJsonArray()
                .get(0).getAsJsonObject().get("acao").getAsString());
        api.esperar(422, "PUT", "/admin/colaboradores/124/senha", Map.of("senha", "curta"), rh);
    }

    @Test
    void quemPodeRedefinir() {
        String lider = api.entrar("juliana.mendonca@oscorp.com");
        String rh = api.entrar("beatriz.albuquerque@oscorp.com");
        Map<String, Object> corpo = Map.of("senha", "outra-provisoria");

        api.esperar(403, "PUT", "/admin/colaboradores/102/senha", corpo, lider);
        // RH não redefine a senha de um gestor (Juliana é líder); o admin pode.
        api.esperar(403, "PUT", "/admin/colaboradores/104/senha", corpo, rh);
        api.esperar(204, "PUT", "/admin/colaboradores/104/senha", corpo, admin);
        JsonObject propria = api.esperar(409, "PUT", "/admin/colaboradores/101/senha", corpo, admin).getAsJsonObject();
        assertEquals("PROPRIA_SENHA", propria.get("codigo").getAsString());
        api.esperar(404, "PUT", "/admin/colaboradores/99999/senha", corpo, admin);
    }
}
