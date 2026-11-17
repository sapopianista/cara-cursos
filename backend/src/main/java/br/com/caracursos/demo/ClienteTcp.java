package br.com.caracursos.demo;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

/**
 * Cliente TCP simples (Aula 10): envia um comando por linha e devolve a resposta do servidor.
 * Não tem regra de negócio, só pede e exibe.
 */
public class ClienteTcp implements AutoCloseable {

    private final Socket socket;
    private final BufferedReader entrada;
    private final PrintWriter saida;

    public ClienteTcp(String host, int porta) throws IOException {
        this.socket = new Socket(host, porta);
        this.entrada = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
        this.saida = new PrintWriter(socket.getOutputStream(), true, StandardCharsets.UTF_8);
    }

    public String enviar(String comando) throws IOException {
        saida.println(comando);
        return entrada.readLine();
    }

    @Override
    public void close() throws IOException {
        socket.close();
    }

    public static void main(String[] args) throws IOException {
        try (ClienteTcp c = new ClienteTcp("localhost", 5050)) {
            System.out.println("VAGAS -> " + c.enviar("VAGAS"));
            System.out.println("RESERVAR;Ana -> " + c.enviar("RESERVAR;Ana"));
            System.out.println("SAIR -> " + c.enviar("SAIR"));
        }
    }
}
