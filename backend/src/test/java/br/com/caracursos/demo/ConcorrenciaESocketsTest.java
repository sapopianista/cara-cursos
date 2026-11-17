package br.com.caracursos.demo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;

class ConcorrenciaESocketsTest {

    @Test
    void comSynchronizedNuncaPassaDoNumeroDeVagas() throws InterruptedException {
        assertEquals(5, CorridaDeVagas.simular(true, 5, 20));
    }

    @Test
    void semSynchronizedPodeEstourarAsVagas() throws InterruptedException {
        // Não é determinístico: o mínimo garantido é preencher as vagas; normalmente passa disso.
        assertTrue(CorridaDeVagas.simular(false, 5, 20) >= 5);
    }

    @Test
    void protocoloRespondeAosComandos() throws IOException, InterruptedException {
        ServidorTcp servidor = new ServidorTcp(0, new Turma(1));
        servidor.iniciar();
        try (ClienteTcp c = new ClienteTcp("localhost", servidor.porta())) {
            assertEquals("OK;1", c.enviar("VAGAS"));
            assertEquals("ERRO;NOME_OBRIGATORIO", c.enviar("RESERVAR"));
            assertEquals("OK;0", c.enviar("RESERVAR;Ana"));
            assertEquals("ERRO;SEM_VAGAS", c.enviar("RESERVAR;Beto"));
            assertEquals("ERRO;COMANDO_DESCONHECIDO", c.enviar("XYZ"));
            assertEquals("OK;ATE_LOGO", c.enviar("SAIR"));
        } finally {
            servidor.parar();
        }
    }

    @Test
    void clientesSimultaneosNaoReservamMaisQueAsVagas() throws Exception {
        ServidorTcp servidor = new ServidorTcp(0, new Turma(3));
        servidor.iniciar();
        AtomicInteger aceitas = new AtomicInteger();
        try {
            List<Thread> threads = new ArrayList<>();
            for (int i = 0; i < 10; i++) {
                String nome = "aluno" + i;
                Thread t = new Thread(() -> {
                    try (ClienteTcp c = new ClienteTcp("localhost", servidor.porta())) {
                        if (c.enviar("RESERVAR;" + nome).startsWith("OK")) aceitas.incrementAndGet();
                    } catch (IOException e) {
                        throw new IllegalStateException(e);
                    }
                });
                threads.add(t);
                t.start();
            }
            for (Thread t : threads) t.join();
        } finally {
            servidor.parar();
        }
        assertEquals(3, aceitas.get());
    }
}
