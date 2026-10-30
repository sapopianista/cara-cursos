package br.com.caracursos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.stream.StreamSupport;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import br.com.caracursos.http.Api;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AlunoIntegracaoTest {

    private final ClienteApi api = new ClienteApi();
    private String tiago;
    private String ana;

    @BeforeAll
    void prepararBanco() throws Exception {
        BancoDeTeste.recriar();
        tiago = api.entrar("tiago.vieira@oscorp.com");
        ana = api.entrar("ana.silveira@oscorp.com");
    }

    private static JsonObject procurar(JsonArray lista, String campo, int valor) {
        return StreamSupport.stream(lista.spliterator(), false).map(JsonElement::getAsJsonObject)
                .filter(o -> o.get(campo).getAsInt() == valor).findFirst().orElseThrow();
    }

    @Test
    void catalogoPaginaEFiltra() {
        JsonObject pagina = api.get("/cursos?porPagina=5&pagina=2", tiago);
        assertEquals(16, pagina.get("total").getAsInt());
        assertEquals(4, pagina.get("totalPaginas").getAsInt());
        assertEquals(5, pagina.getAsJsonArray("itens").size());

        // Busca ignora acentos e maiúsculas: "comunicacao" encontra "Comunicação".
        JsonArray achados = api.get("/cursos?q=COMUNICACAO", tiago).getAsJsonArray("itens");
        assertEquals(1, achados.get(0).getAsJsonObject().get("id").getAsInt());

        // Filtro de nível inclui cursos "todos".
        for (JsonElement e : api.get("/cursos?nivel=avancado&porPagina=50", tiago).getAsJsonArray("itens")) {
            String nivel = e.getAsJsonObject().get("nivel").getAsString();
            assertTrue(nivel.equals("avancado") || nivel.equals("todos"), nivel);
        }

        JsonObject curso = procurar(api.get("/cursos?porPagina=50", tiago).getAsJsonArray("itens"), "id", 10);
        assertEquals("concluido", curso.get("status").getAsString());
        assertEquals("Conformidade", curso.getAsJsonObject("categoria").get("nome").getAsString());
        assertTrue(curso.has("imagemUrl") && curso.get("imagemUrl").isJsonNull(), "null aparece no JSON");
    }

    @Test
    void destaquesCategoriasEAreas() {
        JsonObject d = api.get("/cursos/destaques", tiago);
        assertEquals(12, d.getAsJsonObject("principal").get("id").getAsInt());
        assertFalse(d.getAsJsonArray("semana").isEmpty());
        assertEquals(7, api.esperar(200, "GET", "/cursos/categorias", null, tiago).getAsJsonArray().size());
        JsonArray areas = api.esperar(200, "GET", "/areas", null, tiago).getAsJsonArray();
        assertEquals(8, areas.size());
        assertTrue(areas.get(0).getAsJsonObject().getAsJsonArray("competencias").size() > 0);
        api.esperar(404, "GET", "/cursos/999", null, tiago);
    }

    @Test
    void salaRetomaDeOndeOAlunoParou() {
        JsonObject sala = api.get("/cursos/1/sala", tiago);
        JsonArray aulas = sala.getAsJsonArray("aulas");
        assertEquals(7, aulas.size());
        JsonObject atual = procurar(aulas, "id", sala.get("aulaAtualId").getAsInt());
        assertEquals("em_andamento", atual.get("status").getAsString());
        assertTrue(atual.get("posicaoSegundos").getAsInt() > 0);
        assertEquals(1, sala.getAsJsonObject("curso").getAsJsonObject("trilha").get("id").getAsInt());
        assertEquals(2, sala.getAsJsonArray("materiais").size());
        api.esperar(404, "GET", "/cursos/999/sala", null, tiago);
    }

    @Test
    void salvarPosicaoMatriculaNoCurso() {
        // Ana não está matriculada no curso 16.
        assertEquals(0, api.get("/cursos/16", ana).get("progresso").getAsInt());
        api.esperar(204, "PUT", "/cursos/16/aulas/1601/progresso", Map.of("posicaoSegundos", 95.7), ana);
        JsonObject aula = procurar(api.get("/cursos/16/sala", ana).getAsJsonArray("aulas"), "id", 1601);
        assertEquals(96, aula.get("posicaoSegundos").getAsInt());
        assertEquals("em_andamento", aula.get("status").getAsString());
        assertEquals(1601, api.get("/alunos/me/inicio", ana).getAsJsonObject("continuar")
                .getAsJsonObject("aula").get("id").getAsInt());

        api.esperar(404, "PUT", "/cursos/16/aulas/101/progresso", Map.of("posicaoSegundos", 10), ana);
        api.esperar(422, "PUT", "/cursos/16/aulas/1601/progresso", Map.of("posicaoSegundos", -1), ana);
    }

    @Test
    void concluirTodasAsAulasEmiteCertificado() {
        String bruno = api.entrar("bruno.teixeira@oscorp.com");
        JsonArray aulas = api.get("/cursos/15/sala", bruno).getAsJsonArray("aulas");
        int progresso = 0;
        for (JsonElement e : aulas) {
            int id = e.getAsJsonObject().get("id").getAsInt();
            JsonObject r = api.esperar(200, "POST", "/cursos/15/aulas/" + id + "/conclusao", null, bruno).getAsJsonObject();
            assertEquals("concluida", r.getAsJsonObject("aula").get("status").getAsString());
            progresso = r.get("progressoCurso").getAsInt();
        }
        assertEquals(100, progresso);

        JsonArray certificados = api.get("/alunos/me/progresso", bruno).getAsJsonArray("certificados");
        JsonObject cert = StreamSupport.stream(certificados.spliterator(), false).map(JsonElement::getAsJsonObject)
                .filter(c -> c.get("titulo").getAsString().equals("Pesquisa com Usuários")).findFirst().orElseThrow();
        assertTrue(cert.get("codigo").getAsString().matches("CC-\\d{4}-PES"));
        String url = cert.get("url").getAsString();

        Api.Resposta pdf = api.chamar("GET", url, null, bruno);
        assertEquals(200, pdf.status());
        assertEquals("application/pdf", pdf.tipoConteudo());
        assertTrue(new String(pdf.corpo(), StandardCharsets.ISO_8859_1).startsWith("%PDF"));
        assertTrue(pdf.cabecalhos().get("Content-Disposition").contains("certificado-CC-"));
        api.esperar(404, "GET", url, null, ana);

        JsonArray notificacoes = api.esperar(200, "GET", "/notificacoes", null, bruno).getAsJsonArray();
        assertEquals("Certificado disponível", notificacoes.get(0).getAsJsonObject().get("titulo").getAsString());

        // Concluir de novo não duplica o certificado.
        api.esperar(200, "POST", "/cursos/15/aulas/1501/conclusao", null, bruno);
        assertEquals(certificados.size(), api.get("/alunos/me/progresso", bruno).getAsJsonArray("certificados").size());
    }

    @Test
    void entregaDeAtividade() {
        JsonObject vazia = api.esperar(422, "POST", "/atividades/2/entregas", Map.of("resposta", "  "), tiago)
                .getAsJsonObject();
        assertNotNull(vazia.getAsJsonObject("campos").get("resposta"));
        JsonObject entregue = api.esperar(200, "POST", "/atividades/2/entregas",
                Map.of("resposta", "Minha resposta"), tiago).getAsJsonObject();
        assertEquals("entregue", entregue.get("status").getAsString());
        assertNotNull(entregue.get("entregueEm").getAsString());
        api.esperar(404, "POST", "/atividades/999/entregas", Map.of("resposta", "x"), tiago);

        for (JsonElement a : api.get("/alunos/me/inicio", tiago).getAsJsonArray("atividades")) {
            assertTrue(a.getAsJsonObject().get("id").getAsInt() != 2, "entregue sai das pendentes");
        }
    }

    @Test
    void inicioProgressoEPerfil() {
        JsonObject inicio = api.get("/alunos/me/inicio", tiago);
        assertEquals("Tiago", inicio.getAsJsonObject("usuario").get("nome").getAsString());
        assertEquals(480, inicio.getAsJsonObject("metaSemanal").get("minutosMeta").getAsInt());
        assertTrue(inicio.getAsJsonArray("cursosEmAndamento").size() <= 4);

        JsonObject progresso = api.get("/alunos/me/progresso", tiago);
        JsonArray niveis = progresso.getAsJsonArray("niveis");
        assertEquals("concluido", niveis.get(0).getAsJsonObject().get("estado").getAsString());
        assertEquals("em_andamento", niveis.get(1).getAsJsonObject().get("estado").getAsString());
        assertEquals("bloqueado", niveis.get(2).getAsJsonObject().get("estado").getAsString());
        assertEquals(2, progresso.getAsJsonObject("resumo").getAsJsonObject("nivelAtual").get("ordem").getAsInt());

        JsonObject perfil = api.get("/alunos/me/perfil", tiago);
        assertEquals("COL-0101", perfil.get("matricula").getAsString());
        assertEquals(3, perfil.getAsJsonObject("estatisticas").get("cursosConcluidos").getAsInt());
        assertEquals(4, perfil.getAsJsonObject("estatisticas").get("certificados").getAsInt());
    }

    @Test
    void preferenciasValidamEGravam() {
        JsonObject salvas = api.esperar(200, "PUT", "/alunos/me/preferencias",
                Map.of("metaSemanalMinutos", 240, "resumoSemanal", false), ana).getAsJsonObject();
        assertEquals(240, salvas.get("metaSemanalMinutos").getAsInt());
        assertFalse(salvas.get("resumoSemanal").getAsBoolean());
        assertEquals(240, api.get("/alunos/me/perfil", ana).getAsJsonObject("preferencias")
                .get("metaSemanalMinutos").getAsInt());
        api.esperar(422, "PUT", "/alunos/me/preferencias", Map.of("metaSemanalMinutos", 5), ana);
    }

    @Test
    void recomendacoesEContinuidade() {
        JsonObject r = api.get("/alunos/me/recomendacoes", tiago);
        assertEquals("Operações", r.getAsJsonObject("perfil").get("departamento").getAsString());
        assertEquals(3, r.getAsJsonArray("porCargo").size());
        for (JsonElement e : r.getAsJsonArray("porCargo")) {
            assertEquals("nao_iniciado", e.getAsJsonObject().getAsJsonObject("curso").get("status").getAsString());
        }
        JsonObject continuidade = r.getAsJsonObject("continuidade");
        assertEquals("Segurança da Informação e LGPD", continuidade.get("baseadoEm").getAsString());
        assertFalse(continuidade.getAsJsonArray("cursos").isEmpty());

        // Quem não concluiu nada não recebe "próximos passos".
        assertTrue(api.get("/alunos/me/recomendacoes", api.entrar("matheus.alencar@oscorp.com"))
                .get("continuidade").isJsonNull());
    }

    @Test
    void trilhasENotificacoes() {
        JsonArray trilhas = api.esperar(200, "GET", "/trilhas", null, tiago).getAsJsonArray();
        assertEquals(4, trilhas.size());
        JsonObject integracao = procurar(trilhas, "id", 4);
        assertEquals("concluido", integracao.get("status").getAsString());
        JsonObject detalhe = api.get("/trilhas/1", tiago);
        assertEquals(1, detalhe.getAsJsonArray("cursos").get(0).getAsJsonObject().get("id").getAsInt());
        api.esperar(404, "GET", "/trilhas/99", null, tiago);

        JsonArray notificacoes = api.esperar(200, "GET", "/notificacoes", null, ana).getAsJsonArray();
        int id = notificacoes.get(0).getAsJsonObject().get("id").getAsInt();
        api.esperar(204, "POST", "/notificacoes/" + id + "/leitura", null, ana);
        assertTrue(procurar(api.esperar(200, "GET", "/notificacoes", null, ana).getAsJsonArray(), "id", id)
                .get("lida").getAsBoolean());
        api.esperar(204, "POST", "/notificacoes/leitura", null, ana);
        for (JsonElement n : api.esperar(200, "GET", "/notificacoes", null, ana).getAsJsonArray()) {
            assertTrue(n.getAsJsonObject().get("lida").getAsBoolean());
        }
    }
}
