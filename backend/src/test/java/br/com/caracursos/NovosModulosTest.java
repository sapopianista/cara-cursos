package br.com.caracursos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintStream;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpServer;

import br.com.caracursos.cliente.ClienteConsole;
import br.com.caracursos.concorrencia.ControleLicencas;
import br.com.caracursos.concorrencia.SimuladorOnboarding;
import br.com.caracursos.concorrencia.SimuladorOnboarding.Solicitacao;
import br.com.caracursos.http.ApiException;
import br.com.caracursos.integracao.ConsultaCnpjClient;
import br.com.caracursos.model.Curso;
import br.com.caracursos.model.Entidade;
import br.com.caracursos.model.Matricula;
import br.com.caracursos.model.Usuario;
import br.com.caracursos.model.Usuario.TipoPerfil;
import br.com.caracursos.recursos.RelatorioRecurso;
import br.com.caracursos.recursos.RelatorioStrategy;

/** Testes unitários dos módulos de POO, Streams/Strategy, HttpClient, Concorrência e Cliente CLI. */
class NovosModulosTest {

    @Test
    void herancaDeEntidadeUsuarioEMatricula() {
        Usuario u1 = new Usuario(10, "Ana Clara", "ana@oscorp.com", "hash-secreto", TipoPerfil.COLABORADOR);
        Usuario u2 = new Usuario(10, "Ana Outra", "ana2@oscorp.com", "outro-hash", TipoPerfil.ADMIN);
        Matricula m1 = new Matricula(10, 10, 1, 75, Instant.parse("2026-10-01T10:00:00Z"), null);
        Matricula m2 = new Matricula(10, 10, 2, 100, Instant.parse("2026-10-01T10:00:00Z"), null);

        assertTrue(u1 instanceof Entidade);
        assertTrue(m1 instanceof Entidade);
        assertEquals(u1, u2);
        assertEquals(u1.hashCode(), u2.hashCode());
        assertEquals(m1, m2);
        assertNotEquals(u1, m1, "classes diferentes não são iguais mesmo com mesmo id");

        assertTrue(u1.resumo().contains("Ana Clara"));
        assertFalse(u1.resumo().contains("hash-secreto"));
        assertTrue(m1.resumo().contains("75%"));
    }

    @Test
    void predicatesComparatorsEReduceEmCursos() {
        Curso c1 = curso(1, "Zebra LGPD", 4.2, 10, 100);
        Curso c2 = curso(2, "Comunicação", 4.9, 30, 50);
        Curso c3 = curso(3, "Arquitetura Java", 4.9, 50, 0);
        List<Curso> cursos = List.of(c1, c2, c3);

        List<Curso> concluidos = cursos.stream().filter(Curso.CONCLUIDO).toList();
        assertEquals(List.of(c1), concluidos);

        List<Curso> ativos = cursos.stream().filter(Curso.EM_ANDAMENTO.or(Curso.NAO_INICIADO)).toList();
        assertEquals(List.of(c2, c3), ativos);

        List<Curso> naoConcluidos = cursos.stream().filter(Curso.CONCLUIDO.negate()).toList();
        assertEquals(List.of(c2, c3), naoConcluidos);

        List<Curso> porNota = cursos.stream().sorted(Curso.POR_NOTA_DECRESCENTE).toList();
        assertEquals(List.of(c3, c2, c1), porNota);

        List<Curso> porTitulo = cursos.stream().sorted(Curso.POR_TITULO).toList();
        assertEquals(List.of(c3, c2, c1), porTitulo);

        int somaProgresso = cursos.stream().map(Curso::getProgresso).reduce(0, Integer::sum);
        assertEquals(150, somaProgresso);
    }

    @Test
    void relatorioStrategyListaModelosEResolvePorId() {
        List<RelatorioRecurso.Modelo> modelos = RelatorioStrategy.modelos();
        assertEquals(6, modelos.size());
        assertEquals("engajamento", modelos.get(0).id());
        assertEquals("conformidade", modelos.get(5).id());

        assertEquals(RelatorioStrategy.HORAS, RelatorioStrategy.porId("horas"));
        assertNull(RelatorioStrategy.porId("inexistente"));
        assertNull(RelatorioStrategy.porId(null));
    }

    @Test
    void consultaCnpjClientTrataRespostasHttpEFalhas() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/cnpj/v1/11222333000181", ex -> responder(ex, 200,
                "{\"cnpj\":\"11222333000181\",\"razao_social\":\"Oscorp Brasil Ltda.\",\"nome_fantasia\":\"Oscorp\","
                        + "\"descricao_situacao_cadastral\":\"ATIVA\",\"logradouro\":\"Av Paulista\","
                        + "\"numero\":\"1000\",\"bairro\":\"Bela Vista\",\"municipio\":\"São Paulo\",\"uf\":\"SP\","
                        + "\"cep\":\"01310100\"}"));
        server.createContext("/api/cnpj/v1/04252011000110", ex -> responder(ex, 404, "{\"message\":\"not found\"}"));
        server.createContext("/api/cnpj/v1/19131243000197", ex -> responder(ex, 500, "erro interno"));
        server.start();

        try {
            String baseUrl = "http://127.0.0.1:" + server.getAddress().getPort() + "/api/cnpj/v1";
            ConsultaCnpjClient client = new ConsultaCnpjClient(baseUrl, HttpClient.newHttpClient());

            ConsultaCnpjClient.DadosCnpj dados = client.consultar("11.222.333/0001-81");
            assertEquals("11.222.333/0001-81", dados.cnpj());
            assertEquals("Oscorp Brasil Ltda.", dados.razaoSocial());
            assertEquals("Oscorp", dados.nomeFantasia());
            assertEquals("ATIVA", dados.situacao());
            assertTrue(dados.endereco().contains("Av Paulista, 1000"));

            ApiException invalido = assertThrows(ApiException.class, () -> client.consultar("11.222.333/0001-82"));
            assertEquals(422, invalido.getStatus());

            ApiException naoEncontrado = assertThrows(ApiException.class, () -> client.consultar("04252011000110"));
            assertEquals(404, naoEncontrado.getStatus());

            ApiException erroExterno = assertThrows(ApiException.class, () -> client.consultar("19131243000197"));
            assertEquals(502, erroExterno.getStatus());
        } finally {
            server.stop(0);
        }

        int portaFechada = portaLivre();
        ConsultaCnpjClient offline = new ConsultaCnpjClient("http://127.0.0.1:" + portaFechada + "/api/cnpj/v1",
                HttpClient.newHttpClient());
        ApiException indisponivel = assertThrows(ApiException.class, () -> offline.consultar("11222333000181"));
        assertEquals(503, indisponivel.getStatus());
    }

    @Test
    void simulacaoConcorrenteProtegeLimiteDeLicencas() {
        assertThrows(IllegalArgumentException.class, () -> new ControleLicencas(5, 6));
        assertThrows(IllegalArgumentException.class, () -> new ControleLicencas(-1, 0));

        ControleLicencas controle = new ControleLicencas(10, 7);
        List<Solicitacao> lote = List.of(
                new Solicitacao("RH", "Ana", "reservar"),
                new Solicitacao("Admin", "Bruno", "reservar"),
                new Solicitacao("RH", "Carla", "reservar"),
                new Solicitacao("Admin", "Diego", "reservar"),
                new Solicitacao("RH", "Eva", "reservar"),
                new Solicitacao("Admin", "Fábio", "reservar")
        );

        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        SimuladorOnboarding.Resultado r = SimuladorOnboarding.executar(controle, lote, 10,
                new PrintStream(buffer, true, StandardCharsets.UTF_8));

        assertEquals(6, r.total());
        assertEquals(3, r.aprovadas());
        assertEquals(3, r.recusadas());
        assertEquals(10, r.emUsoFinal());
        assertEquals(0, r.disponiveisFinal());

        String logs = buffer.toString(StandardCharsets.UTF_8);
        assertTrue(logs.contains("[Thread #"));
        assertTrue(logs.contains("INÍCIO"));
        assertTrue(logs.contains("TÉRMINO"));

        assertTrue(controle.liberar("Admin", "Ana"));
        assertEquals(1, controle.getDisponiveis());
    }

    @Test
    void clienteConsoleComunicaComServidorERecuperaFalhas() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/saude", ex -> responder(ex, 200, "{\"status\":\"ok\"}"));
        server.start();

        try {
            String baseUrl = "http://127.0.0.1:" + server.getAddress().getPort() + "/api";
            ClienteConsole cliente = new ClienteConsole(baseUrl, HttpClient.newHttpClient());
            assertEquals("Servidor online (status: ok).", cliente.verificarSaude());
            assertTrue(cliente.listarCursos().contains("Faça login primeiro"));
        } finally {
            server.stop(0);
        }

        int portaFechada = portaLivre();
        ClienteConsole offline = new ClienteConsole("http://127.0.0.1:" + portaFechada + "/api",
                HttpClient.newHttpClient());
        assertTrue(offline.verificarSaude().contains("Não foi possível conectar ao servidor"));
    }

    private static Curso curso(int id, String titulo, double nota, int avaliacoes, int progresso) {
        Curso c = new Curso();
        c.setId(id);
        c.setTitulo(titulo);
        c.setNota(nota);
        c.setTotalAvaliacoes(avaliacoes);
        c.setProgresso(progresso);
        return c;
    }

    private static void responder(com.sun.net.httpserver.HttpExchange exchange, int status, String corpo)
            throws IOException {
        byte[] bytes = corpo.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream out = exchange.getResponseBody()) {
            out.write(bytes);
        }
    }

    private static int portaLivre() throws IOException {
        try (ServerSocket socket = new ServerSocket(0)) {
            return socket.getLocalPort();
        }
    }
}
