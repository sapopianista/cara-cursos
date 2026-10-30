package br.com.caracursos;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import br.com.caracursos.http.Api;
import br.com.caracursos.http.Json;

/** Chama a {@link Api} como o frontend chamaria, sem subir servidor HTTP. */
public final class ClienteApi {

    private final Api api = new Api();

    public Api.Resposta chamar(String metodo, String caminhoComQuery, Object corpo, String token) {
        String caminho = caminhoComQuery;
        Map<String, String> parametros = new HashMap<>();
        int interrogacao = caminhoComQuery.indexOf('?');
        if (interrogacao >= 0) {
            caminho = caminhoComQuery.substring(0, interrogacao);
            for (String par : caminhoComQuery.substring(interrogacao + 1).split("&")) {
                String[] kv = par.split("=", 2);
                parametros.put(kv[0], kv.length > 1 ? URLDecoder.decode(kv[1], StandardCharsets.UTF_8) : "");
            }
        }
        String json = corpo == null ? "" : corpo instanceof String s ? s : Json.escrever(corpo);
        return api.processar(new Api.Pedido(metodo, caminho, parametros, json, token == null ? null : "Bearer " + token));
    }

    /** Faz a chamada, confere o status e devolve o corpo JSON ({@code null} se não houver). */
    public JsonElement esperar(int status, String metodo, String caminho, Object corpo, String token) {
        Api.Resposta r = chamar(metodo, caminho, corpo, token);
        assertEquals(status, r.status(), () -> metodo + " " + caminho + " → " + r.texto());
        boolean json = r.tipoConteudo() != null && r.tipoConteudo().startsWith("application/json");
        return json ? JsonParser.parseString(r.texto()) : null;
    }

    public JsonObject get(String caminho, String token) {
        return esperar(200, "GET", caminho, null, token).getAsJsonObject();
    }

    /** Entra com a senha das contas de teste e devolve o token. */
    public String entrar(String email) {
        JsonObject r = esperar(200, "POST", "/auth/login",
                Map.of("identificador", email, "senha", "demo1234", "lembrar", false), null).getAsJsonObject();
        return r.get("token").getAsString();
    }
}
