package br.com.caracursos.integracao;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import br.com.caracursos.http.ApiException;
import br.com.caracursos.http.Json;
import br.com.caracursos.util.Cnpj;

/**
 * Cliente HTTP para consulta de dados cadastrais de empresas por CNPJ em API
 * pública externa (por padrão, BrasilAPI), usando {@link HttpClient}.
 */
public class ConsultaCnpjClient {

    public record DadosCnpj(String cnpj, String razaoSocial, String nomeFantasia, String situacao,
                            String municipio, String uf, String endereco) {
    }

    public static final String URL_PADRAO = "https://brasilapi.com.br/api/cnpj/v1";
    private static final Duration TIMEOUT = Duration.ofSeconds(8);
    private static final HttpClient HTTP_PADRAO = HttpClient.newBuilder()
            .connectTimeout(TIMEOUT)
            .build();

    private final String urlBase;
    private final HttpClient httpClient;

    public ConsultaCnpjClient() {
        this(urlConfigurada(), HTTP_PADRAO);
    }

    public ConsultaCnpjClient(String urlBase, HttpClient httpClient) {
        String base = Objects.requireNonNull(urlBase, "urlBase não pode ser nula").trim();
        this.urlBase = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        this.httpClient = Objects.requireNonNull(httpClient, "httpClient não pode ser nulo");
    }

    /** Consulta o CNPJ (com ou sem máscara) no serviço externo e valida o retorno HTTP/JSON. */
    public DadosCnpj consultar(String cnpj) {
        if (!Cnpj.valido(cnpj)) {
            throw ApiException.validacao(Map.of("cnpj", "CNPJ inválido. Confira os 14 dígitos."));
        }
        String digitos = cnpj.replaceAll("\\D", "");
        HttpRequest requisicao = HttpRequest.newBuilder()
                .uri(URI.create(urlBase + "/" + digitos))
                .timeout(TIMEOUT)
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> resposta;
        try {
            resposta = httpClient.send(requisicao, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        } catch (HttpTimeoutException e) {
            throw apiIndisponivel("O serviço externo de consulta de CNPJ demorou para responder.");
        } catch (IOException e) {
            throw apiIndisponivel("Não foi possível consultar o CNPJ no serviço externo. Tente novamente em instantes.");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw apiIndisponivel("A consulta externa de CNPJ foi interrompida.");
        }

        int status = resposta.statusCode();
        if (status == 404) {
            throw ApiException.naoEncontrado("CNPJ não encontrado na base pública.");
        }
        if (status < 200 || status >= 300) {
            throw new ApiException(502, "API_EXTERNA_INDISPONIVEL",
                    "O serviço externo de consulta de CNPJ retornou erro (HTTP " + status + ").", null);
        }

        JsonObject json = Json.lerObjeto(resposta.body());
        String razaoSocial = texto(json, "razao_social");
        String nomeFantasia = texto(json, "nome_fantasia");
        if (nomeFantasia == null) nomeFantasia = razaoSocial;
        String situacao = texto(json, "descricao_situacao_cadastral");
        String municipio = texto(json, "municipio");
        String uf = texto(json, "uf");
        String endereco = montarEndereco(json, municipio, uf);

        return new DadosCnpj(Cnpj.formatar(digitos), razaoSocial, nomeFantasia, situacao, municipio, uf, endereco);
    }

    private static ApiException apiIndisponivel(String mensagem) {
        return new ApiException(503, "API_EXTERNA_INDISPONIVEL", mensagem, null);
    }

    private static String urlConfigurada() {
        String valor = System.getProperty("CNPJ_API_URL");
        if (valor == null || valor.isBlank()) valor = System.getenv("CNPJ_API_URL");
        return (valor == null || valor.isBlank()) ? URL_PADRAO : valor;
    }

    private static String texto(JsonObject obj, String campo) {
        JsonElement elemento = obj.get(campo);
        if (elemento == null || elemento.isJsonNull() || !elemento.isJsonPrimitive()) return null;
        String valor = elemento.getAsString().trim();
        return valor.isEmpty() ? null : valor;
    }

    private static String montarEndereco(JsonObject json, String municipio, String uf) {
        List<String> partes = new ArrayList<>();
        String logradouro = texto(json, "logradouro");
        String numero = texto(json, "numero");
        String bairro = texto(json, "bairro");
        String cep = texto(json, "cep");

        if (logradouro != null) {
            partes.add(numero != null ? logradouro + ", " + numero : logradouro);
        }
        if (bairro != null) partes.add(bairro);
        if (municipio != null && uf != null) partes.add(municipio + "/" + uf);
        else if (municipio != null) partes.add(municipio);
        if (cep != null) partes.add("CEP " + cep);
        return partes.isEmpty() ? null : String.join(" - ", partes);
    }
}
