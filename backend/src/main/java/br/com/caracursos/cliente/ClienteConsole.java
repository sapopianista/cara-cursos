package br.com.caracursos.cliente;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.Objects;
import java.util.Scanner;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import br.com.caracursos.http.ApiException;
import br.com.caracursos.http.Json;
import br.com.caracursos.integracao.ConsultaCnpjClient;

/**
 * Cliente Java de linha de comando que se comunica pela rede com a API REST
 * do Cara Cursos usando {@link HttpClient} e exibe um menu interativo.
 */
public class ClienteConsole {

    public static final String API_URL_PADRAO = "http://localhost:8080/api";
    private static final Duration TIMEOUT = Duration.ofSeconds(10);

    private final String baseUrl;
    private final HttpClient httpClient;
    private final ConsultaCnpjClient consultaCnpj;
    private String token;

    public ClienteConsole() {
        this(urlConfigurada(), HttpClient.newBuilder().connectTimeout(TIMEOUT).build(), new ConsultaCnpjClient());
    }

    public ClienteConsole(String baseUrl, HttpClient httpClient) {
        this(baseUrl, httpClient, new ConsultaCnpjClient());
    }

    public ClienteConsole(String baseUrl, HttpClient httpClient, ConsultaCnpjClient consultaCnpj) {
        String base = Objects.requireNonNull(baseUrl, "baseUrl não pode ser nula").trim();
        this.baseUrl = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        this.httpClient = Objects.requireNonNull(httpClient, "httpClient não pode ser nulo");
        this.consultaCnpj = Objects.requireNonNull(consultaCnpj, "consultaCnpj não pode ser nulo");
    }

    public String verificarSaude() {
        RespostaHttp r = enviar("GET", "/saude", null);
        if (!r.sucesso()) return r.mensagemErro();
        String status = r.objeto() != null && r.objeto().has("status") ? r.objeto().get("status").getAsString() : "ok";
        return "Servidor online (status: " + status + ").";
    }

    public String autenticar(String email, String senha) {
        RespostaHttp r = enviar("POST", "/auth/login",
                Json.escrever(Map.of("identificador", email, "senha", senha, "lembrar", false)));
        if (!r.sucesso()) return r.mensagemErro();
        JsonObject corpo = r.objeto();
        if (corpo == null || !corpo.has("token")) {
            return "Resposta inesperada do servidor durante o login.";
        }
        this.token = corpo.get("token").getAsString();
        JsonObject usuario = corpo.getAsJsonObject("usuario");
        String nome = usuario != null && usuario.has("nome") ? usuario.get("nome").getAsString() : email;
        String papel = usuario != null && usuario.has("papel") ? usuario.get("papel").getAsString() : "";
        return "Login realizado com sucesso! Bem-vindo(a), " + nome + " [" + papel + "].";
    }

    public String listarCursos() {
        if (token == null) return "Faça login primeiro (opção 2).";
        RespostaHttp r = enviar("GET", "/cursos?pagina=1&porPagina=10", null);
        if (!r.sucesso()) return r.mensagemErro();
        JsonObject corpo = r.objeto();
        if (corpo == null || !corpo.has("itens")) return "Nenhum curso retornado.";
        StringBuilder sb = new StringBuilder("=== Catálogo de Cursos ===");
        for (JsonElement e : corpo.getAsJsonArray("itens")) {
            JsonObject c = e.getAsJsonObject();
            sb.append(String.format("%n- [%d] %s (%s | %d min | progresso: %d%%)",
                    c.get("id").getAsInt(),
                    c.get("titulo").getAsString(),
                    c.get("nivel").getAsString(),
                    c.get("duracaoMinutos").getAsInt(),
                    c.get("progresso").getAsInt()));
        }
        return sb.toString();
    }

    public String consultarPerfil() {
        if (token == null) return "Faça login primeiro (opção 2).";
        RespostaHttp r = enviar("GET", "/alunos/me/perfil", null);
        if (!r.sucesso()) return r.mensagemErro();
        JsonObject u = r.objeto();
        if (u == null) return "Perfil indisponível.";
        JsonObject stats = u.getAsJsonObject("estatisticas");
        return String.format("Nome: %s | E-mail: %s | Matrícula: %s | Concluídos: %d | Certificados: %d",
                texto(u, "nome"), texto(u, "email"), texto(u, "matricula"),
                stats != null ? stats.get("cursosConcluidos").getAsInt() : 0,
                stats != null ? stats.get("certificados").getAsInt() : 0);
    }

    public String resumoLicencas() {
        if (token == null) return "Faça login primeiro (opção 2).";
        RespostaHttp r = enviar("GET", "/admin/colaboradores/resumo", null);
        if (!r.sucesso()) return r.mensagemErro();
        JsonObject corpo = r.objeto();
        if (corpo == null) return "Resumo indisponível.";
        JsonObject lic = corpo.getAsJsonObject("licencas");
        return String.format("Colaboradores: %d total (%d ativos, %d pendentes, %d inativos) | Licenças: %d/%d em uso",
                corpo.get("total").getAsInt(),
                corpo.get("ativos").getAsInt(),
                corpo.get("pendentes").getAsInt(),
                corpo.get("inativos").getAsInt(),
                lic != null ? lic.get("emUso").getAsInt() : 0,
                lic != null ? lic.get("contratadas").getAsInt() : 0);
    }

    public String consultarCnpjExterno(String cnpj) {
        try {
            ConsultaCnpjClient.DadosCnpj d = consultaCnpj.consultar(cnpj);
            return String.format("CNPJ: %s%nRazão social: %s%nNome fantasia: %s%nSituação: %s%nEndereço: %s",
                    d.cnpj(), d.razaoSocial(), d.nomeFantasia(), d.situacao(), d.endereco());
        } catch (ApiException e) {
            return "Erro (" + e.getStatus() + "): " + e.getMessage();
        }
    }

    public String logout() {
        if (token == null) return "Sessão encerrada.";
        enviar("POST", "/auth/logout", "");
        token = null;
        return "Sessão encerrada com sucesso.";
    }

    private RespostaHttp enviar(String metodo, String caminho, String corpo) {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + caminho))
                .timeout(TIMEOUT)
                .header("Accept", "application/json");
        if (token != null) builder.header("Authorization", "Bearer " + token);
        if (corpo != null) {
            builder.header("Content-Type", "application/json; charset=UTF-8")
                    .method(metodo, HttpRequest.BodyPublishers.ofString(corpo, StandardCharsets.UTF_8));
        } else {
            builder.method(metodo, HttpRequest.BodyPublishers.noBody());
        }

        try {
            HttpResponse<String> resp = httpClient.send(builder.build(),
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            int status = resp.statusCode();
            if (status >= 200 && status < 300) {
                return new RespostaHttp(true, status, resp.body(), null);
            }
            return new RespostaHttp(false, status, resp.body(), extrairMensagemErro(status, resp.body()));
        } catch (HttpTimeoutException e) {
            return new RespostaHttp(false, 408, null, "Tempo esgotado ao aguardar resposta do servidor.");
        } catch (IOException e) {
            return new RespostaHttp(false, 0, null,
                    "Não foi possível conectar ao servidor em " + baseUrl + ". Verifique se a API está rodando.");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new RespostaHttp(false, 0, null, "Requisição interrompida.");
        }
    }

    private static String extrairMensagemErro(int status, String body) {
        if (body != null && !body.isBlank()) {
            try {
                JsonElement el = JsonParser.parseString(body);
                if (el.isJsonObject() && el.getAsJsonObject().has("mensagem")) {
                    return "Erro HTTP " + status + ": " + el.getAsJsonObject().get("mensagem").getAsString();
                }
            } catch (RuntimeException ignored) {
                // Resposta não é JSON válido; usa mensagem padrão abaixo.
            }
        }
        return "Erro HTTP " + status + " ao comunicar com o servidor.";
    }

    private static String texto(JsonObject o, String campo) {
        return o.has(campo) && !o.get(campo).isJsonNull() ? o.get(campo).getAsString() : "-";
    }

    private static String urlConfigurada() {
        String valor = System.getProperty("API_URL");
        if (valor == null || valor.isBlank()) valor = System.getenv("API_URL");
        return (valor == null || valor.isBlank()) ? API_URL_PADRAO : valor;
    }

    private record RespostaHttp(boolean sucesso, int status, String corpo, String mensagemErro) {
        JsonObject objeto() {
            if (corpo == null || corpo.isBlank()) return null;
            JsonElement el = JsonParser.parseString(corpo);
            return el.isJsonObject() ? el.getAsJsonObject() : null;
        }
    }

    public static void main(String[] args) {
        ClienteConsole cliente = new ClienteConsole();
        try (Scanner entrada = new Scanner(System.in, StandardCharsets.UTF_8)) {
            boolean executando = true;
            while (executando) {
                System.out.println("\n=== Cara Cursos — Cliente Java (Rede) ===");
                System.out.println("1. Verificar saúde do servidor");
                System.out.println("2. Entrar (login)");
                System.out.println("3. Listar catálogo de cursos");
                System.out.println("4. Consultar meu perfil");
                System.out.println("5. Ver resumo de colaboradores e licenças (Gestor)");
                System.out.println("6. Consultar CNPJ (API externa)");
                System.out.println("0. Sair");
                System.out.print("Escolha uma opção: ");

                String opcao = entrada.nextLine().trim();
                switch (opcao) {
                    case "1" -> System.out.println(cliente.verificarSaude());
                    case "2" -> {
                        System.out.print("E-mail: ");
                        String email = entrada.nextLine().trim();
                        System.out.print("Senha: ");
                        String senha = entrada.nextLine();
                        System.out.println(cliente.autenticar(email, senha));
                    }
                    case "3" -> System.out.println(cliente.listarCursos());
                    case "4" -> System.out.println(cliente.consultarPerfil());
                    case "5" -> System.out.println(cliente.resumoLicencas());
                    case "6" -> {
                        System.out.print("CNPJ (14 dígitos ou formatado): ");
                        System.out.println(cliente.consultarCnpjExterno(entrada.nextLine().trim()));
                    }
                    case "0" -> {
                        System.out.println(cliente.logout());
                        executando = false;
                    }
                    default -> System.out.println("Opção inválida.");
                }
            }
        }
    }
}
