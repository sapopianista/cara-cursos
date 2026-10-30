package br.com.caracursos.http;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import br.com.caracursos.seguranca.Permissao;

/**
 * Tabela de rotas: método + caminho com variáveis ({@code /cursos/{id}/sala}).
 * Cada rota declara quem pode acessá-la ({@code null} = pública).
 */
public final class Roteador {

    /** O que uma rota executa. O retorno vira o corpo da resposta (ver {@link Api}). */
    @FunctionalInterface
    public interface Acao {
        Object executar(Requisicao requisicao) throws Exception;
    }

    record Rota(String metodo, String modelo, Pattern padrao, List<String> variaveis, Permissao permissao, Acao acao) {
    }

    record Encontrada(Rota rota, Map<String, String> variaveis) {
    }

    private static final Pattern VARIAVEL = Pattern.compile("\\{([a-zA-Z]+)}");

    private final List<Rota> rotas = new ArrayList<>();

    public void get(String caminho, Permissao permissao, Acao acao) {
        adicionar("GET", caminho, permissao, acao);
    }

    public void post(String caminho, Permissao permissao, Acao acao) {
        adicionar("POST", caminho, permissao, acao);
    }

    public void put(String caminho, Permissao permissao, Acao acao) {
        adicionar("PUT", caminho, permissao, acao);
    }

    public void patch(String caminho, Permissao permissao, Acao acao) {
        adicionar("PATCH", caminho, permissao, acao);
    }

    public void delete(String caminho, Permissao permissao, Acao acao) {
        adicionar("DELETE", caminho, permissao, acao);
    }

    private void adicionar(String metodo, String caminho, Permissao permissao, Acao acao) {
        List<String> variaveis = new ArrayList<>();
        Matcher m = VARIAVEL.matcher(caminho);
        StringBuilder regex = new StringBuilder("^");
        int ultimo = 0;
        while (m.find()) {
            regex.append(Pattern.quote(caminho.substring(ultimo, m.start()))).append("([^/]+)");
            variaveis.add(m.group(1));
            ultimo = m.end();
        }
        regex.append(Pattern.quote(caminho.substring(ultimo))).append("$");
        for (Rota r : rotas) {
            if (r.metodo().equals(metodo) && r.modelo().equals(caminho)) {
                throw new IllegalStateException("Rota duplicada: " + metodo + " " + caminho);
            }
        }
        rotas.add(new Rota(metodo, caminho, Pattern.compile(regex.toString()), List.copyOf(variaveis), permissao, acao));
    }

    /**
     * Rotas fixas têm prioridade sobre as com variável
     * ({@code /cursos/destaques} antes de {@code /cursos/{id}}).
     */
    Encontrada encontrar(String metodo, String caminho) {
        String normalizado = caminho.length() > 1 && caminho.endsWith("/")
                ? caminho.substring(0, caminho.length() - 1)
                : caminho;
        Encontrada comVariavel = null;
        boolean caminhoExiste = false;
        for (Rota r : rotas) {
            Matcher m = r.padrao().matcher(normalizado);
            if (!m.matches()) continue;
            caminhoExiste = true;
            if (!r.metodo().equals(metodo)) continue;
            Map<String, String> valores = new HashMap<>();
            for (int i = 0; i < r.variaveis().size(); i++) valores.put(r.variaveis().get(i), m.group(i + 1));
            Encontrada achada = new Encontrada(r, valores);
            if (r.variaveis().isEmpty()) return achada;
            if (comVariavel == null) comVariavel = achada;
        }
        if (comVariavel != null) return comVariavel;
        if (caminhoExiste) throw new ApiException(405, "METODO_NAO_PERMITIDO", "Método não permitido nesta rota.", null);
        throw ApiException.naoEncontrado("Rota não encontrada: " + metodo + " " + normalizado);
    }
}
