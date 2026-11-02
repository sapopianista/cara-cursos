package br.com.caracursos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SuporteIntegracaoTest {

    private final ClienteApi api = new ClienteApi();
    private String admin;
    private String aluna;

    @BeforeAll
    void prepararBanco() throws Exception {
        BancoDeTeste.recriar();
        admin = api.entrar("tiago.vieira@oscorp.com");
        aluna = api.entrar("ana.silveira@oscorp.com");
    }

    private static Map<String, Object> chamado(String escopo, String assunto, Object cursoId) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("escopo", escopo);
        corpo.put("assunto", assunto);
        corpo.put("titulo", "O vídeo da aula 3 não carrega");
        corpo.put("descricao", "Desde ontem o player fica carregando sem parar.");
        corpo.put("cursoId", cursoId);
        return corpo;
    }

    @Test
    void centralDoAluno() {
        JsonObject r = api.get("/suporte?escopo=aluno", admin);
        assertEquals(4, r.getAsJsonArray("faq").size());
        assertEquals("Equipe pedagógica e técnica", r.getAsJsonObject("contato").get("canal").getAsString());
        assertEquals(4, r.getAsJsonArray("assuntos").size());
        assertTrue(r.getAsJsonArray("cursos").size() > 0);

        JsonArray chamados = r.getAsJsonArray("chamados");
        assertEquals(2, chamados.size());
        JsonObject recente = chamados.get(0).getAsJsonObject();
        assertEquals(4109, recente.get("id").getAsInt());
        assertEquals("respondido", recente.get("status").getAsString());
        assertEquals(1, recente.getAsJsonObject("curso").get("id").getAsInt());

        // Cada aluno vê só os próprios chamados.
        String juliana = api.entrar("juliana.mendonca@oscorp.com");
        assertEquals(0, api.get("/suporte?escopo=aluno", juliana).getAsJsonArray("chamados").size());
    }

    @Test
    void centralDoGestor() {
        JsonObject r = api.get("/suporte?escopo=gestor", admin);
        assertEquals("Camila Fontes", r.getAsJsonObject("contato").get("nome").getAsString());
        assertEquals(0, r.getAsJsonArray("cursos").size());
        JsonArray chamados = r.getAsJsonArray("chamados");
        assertEquals(2, chamados.size(), "chamados de todos os gestores");
        assertTrue(chamados.get(0).getAsJsonObject().get("curso").isJsonNull());

        api.esperar(403, "GET", "/suporte?escopo=gestor", null, aluna);
        api.esperar(400, "GET", "/suporte?escopo=outro", null, aluna);
        api.esperar(401, "GET", "/suporte?escopo=aluno", null, null);
    }

    @Test
    void abrirChamadoValidaEApareceNaLista() {
        JsonObject invalido = api.esperar(422, "POST", "/suporte/chamados",
                Map.of("escopo", "aluno", "assunto", "Trilhas e cursos", "titulo", "", "descricao", "curta",
                        "cursoId", 9999), aluna).getAsJsonObject();
        assertEquals(4, invalido.getAsJsonObject("campos").size());
        api.esperar(403, "POST", "/suporte/chamados", chamado("gestor", "Trilhas e cursos", ""), aluna);

        JsonObject criado = api.esperar(200, "POST", "/suporte/chamados",
                chamado("aluno", "Problema técnico com vídeo", "3"), aluna).getAsJsonObject();
        assertEquals("em_analise", criado.get("status").getAsString());
        assertEquals(3, criado.getAsJsonObject("curso").get("id").getAsInt());

        // Sem curso: o formulário manda "".
        JsonObject semCurso = api.esperar(200, "POST", "/suporte/chamados",
                chamado("aluno", "Outro assunto", ""), aluna).getAsJsonObject();
        assertTrue(semCurso.get("curso").isJsonNull());

        JsonArray lista = api.get("/suporte?escopo=aluno", aluna).getAsJsonArray("chamados");
        assertEquals(2, lista.size());
        assertEquals(semCurso.get("id").getAsInt(), lista.get(0).getAsJsonObject().get("id").getAsInt());
    }
}
