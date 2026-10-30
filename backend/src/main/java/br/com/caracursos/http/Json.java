package br.com.caracursos.http;

import java.io.IOException;
import java.lang.reflect.Type;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.google.gson.JsonParser;
import com.google.gson.TypeAdapter;
import com.google.gson.reflect.TypeToken;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;
import com.google.gson.stream.JsonWriter;

/**
 * Configuração única do Gson.
 * <ul>
 *   <li>{@code null} é escrito (o frontend distingue {@code null} de campo ausente);</li>
 *   <li>datas ({@link Instant}) em ISO 8601 UTC: {@code 2026-10-30T14:15:00Z}.</li>
 * </ul>
 */
public final class Json {

    private static final Type LISTA_TEXTO = new TypeToken<List<String>>() { }.getType();

    private static final Gson GSON = new GsonBuilder()
            .serializeNulls()
            .disableHtmlEscaping()
            .registerTypeAdapter(Instant.class, new InstantAdapter())
            .create();

    private Json() {
    }

    public static String escrever(Object valor) {
        return GSON.toJson(valor);
    }

    /** Converte um objeto em árvore JSON, para acrescentar campos antes de responder. */
    public static JsonObject objeto(Object valor) {
        return GSON.toJsonTree(valor).getAsJsonObject();
    }

    public static JsonElement arvore(Object valor) {
        return GSON.toJsonTree(valor);
    }

    /** Lê o corpo da requisição. Corpo vazio vira objeto vazio; JSON inválido vira 400. */
    public static JsonObject lerObjeto(String corpo) {
        if (corpo == null || corpo.isBlank()) return new JsonObject();
        try {
            JsonElement elemento = JsonParser.parseString(corpo);
            if (!elemento.isJsonObject()) {
                throw ApiException.requisicaoInvalida("O corpo da requisição deve ser um objeto JSON.");
            }
            return elemento.getAsJsonObject();
        } catch (JsonParseException e) {
            throw ApiException.requisicaoInvalida("O corpo da requisição não é um JSON válido.");
        }
    }

    /** Lê colunas JSON do banco do tipo {@code ["a", "b"]}. */
    public static List<String> listaDeTexto(String json) {
        if (json == null || json.isBlank()) return List.of();
        return GSON.fromJson(json, LISTA_TEXTO);
    }

    private static final class InstantAdapter extends TypeAdapter<Instant> {
        @Override
        public void write(JsonWriter saida, Instant valor) throws IOException {
            if (valor == null) saida.nullValue();
            else saida.value(valor.toString());
        }

        @Override
        public Instant read(JsonReader entrada) throws IOException {
            if (entrada.peek() == JsonToken.NULL) {
                entrada.nextNull();
                return null;
            }
            String texto = entrada.nextString();
            try {
                return Instant.parse(texto);
            } catch (DateTimeParseException e) {
                throw new JsonParseException("Data inválida: " + texto, e);
            }
        }
    }
}
