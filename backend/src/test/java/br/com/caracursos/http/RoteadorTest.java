package br.com.caracursos.http;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

import br.com.caracursos.seguranca.Permissao;

class RoteadorTest {

    private final Roteador roteador = new Roteador();

    RoteadorTest() {
        roteador.get("/cursos/{id}", Permissao.AUTENTICADO, r -> "detalhe");
        roteador.get("/cursos/destaques", Permissao.AUTENTICADO, r -> "destaques");
        roteador.put("/cursos/{id}/aulas/{aulaId}/progresso", Permissao.AUTENTICADO, r -> "progresso");
    }

    @Test
    void rotaFixaTemPrioridadeSobreVariavel() throws Exception {
        assertEquals("destaques", roteador.encontrar("GET", "/cursos/destaques").rota().acao().executar(null));
        assertEquals("detalhe", roteador.encontrar("GET", "/cursos/7").rota().acao().executar(null));
    }

    @Test
    void extraiVariaveisDoCaminho() {
        Roteador.Encontrada e = roteador.encontrar("PUT", "/cursos/3/aulas/301/progresso/");
        assertEquals("3", e.variaveis().get("id"));
        assertEquals("301", e.variaveis().get("aulaId"));
    }

    @Test
    void metodoErradoE405CaminhoInexistenteE404() {
        assertEquals(405, assertThrows(ApiException.class, () -> roteador.encontrar("DELETE", "/cursos/3")).getStatus());
        assertEquals(404, assertThrows(ApiException.class, () -> roteador.encontrar("GET", "/nada")).getStatus());
    }
}
