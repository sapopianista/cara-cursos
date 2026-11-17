package br.com.caracursos.demo;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

/**
 * Servidor TCP (Aula 10). As regras de negócio ficam aqui; o cliente só envia comandos e mostra a resposta.
 *
 * <p>Protocolo de aplicação: uma mensagem por linha, no formato {@code OPERACAO;PARAMETROS}.
 * <ul>
 *   <li>{@code VAGAS} &rarr; {@code OK;<livres>}</li>
 *   <li>{@code RESERVAR;<nome>} &rarr; {@code OK;<livres>} ou {@code ERRO;SEM_VAGAS}</li>
 *   <li>{@code SAIR} &rarr; {@code OK;ATE_LOGO} e a conexão é encerrada</li>
 *   <li>qualquer outra coisa &rarr; {@code ERRO;COMANDO_DESCONHECIDO}</li>
 * </ul>
 * Cada cliente é atendido em uma thread própria, todas compartilhando a mesma {@link Turma}
 * (por isso o método {@code reservar} é {@code synchronized}).
 */
public class ServidorTcp {

    private final ServerSocket servidor;
    private final Turma turma;
    private Thread aceitador;

    /** Use porta 0 para o sistema escolher uma porta livre (útil em testes). */
    public ServidorTcp(int porta, Turma turma) throws IOException {
        this.servidor = new ServerSocket(porta);
        this.turma = turma;
    }

    public int porta() {
        return servidor.getLocalPort();
    }

    /** Começa a aceitar conexões em segundo plano. */
    public void iniciar() {
        aceitador = new Thread(this::aceitar, "servidor-tcp");
        aceitador.start();
    }

    public void parar() throws IOException, InterruptedException {
        servidor.close(); // faz o accept() bloqueado lançar exceção e o laço terminar
        if (aceitador != null) aceitador.join();
    }

    private void aceitar() {
        while (!servidor.isClosed()) {
            try {
                Socket cliente = servidor.accept(); // bloqueia até alguém conectar
                new Thread(() -> atender(cliente), "cliente-" + cliente.getPort()).start();
            } catch (IOException e) {
                return; // servidor fechado
            }
        }
    }

    private void atender(Socket cliente) {
        try (cliente;
             BufferedReader entrada = new BufferedReader(
                     new InputStreamReader(cliente.getInputStream(), StandardCharsets.UTF_8));
             PrintWriter saida = new PrintWriter(cliente.getOutputStream(), true, StandardCharsets.UTF_8)) {
            String linha;
            while ((linha = entrada.readLine()) != null) {
                String resposta = processar(linha);
                saida.println(resposta);
                if (linha.trim().equalsIgnoreCase("SAIR")) return;
            }
        } catch (IOException e) {
            // cliente desconectou de forma abrupta: nada a fazer
        }
    }

    /** Interpreta uma linha do protocolo e devolve a resposta. Sem E/S, para ser fácil de testar. */
    String processar(String linha) {
        String[] partes = linha.trim().split(";", 2);
        switch (partes[0].toUpperCase()) {
            case "VAGAS":
                return "OK;" + turma.vagasLivres();
            case "RESERVAR":
                if (partes.length < 2 || partes[1].isBlank()) return "ERRO;NOME_OBRIGATORIO";
                return turma.reservar() ? "OK;" + turma.vagasLivres() : "ERRO;SEM_VAGAS";
            case "SAIR":
                return "OK;ATE_LOGO";
            default:
                return "ERRO;COMANDO_DESCONHECIDO";
        }
    }

    public static void main(String[] args) throws IOException {
        ServidorTcp s = new ServidorTcp(5050, new Turma(5));
        System.out.println("Servidor ouvindo na porta " + s.porta());
        s.iniciar();
    }
}
