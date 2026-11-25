package br.com.caracursos.demo;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Demonstração de threads e sincronização (Aulas 08 e 09):
 * várias threads tentam reservar vaga numa {@link Turma} com poucas vagas.
 *
 * <p>Execute o {@code main} para ver a diferença entre a versão sem e com {@code synchronized}.
 */
public final class CorridaDeVagas {

    private CorridaDeVagas() {
    }

    /**
     * Dispara {@code candidatos} threads (cada uma uma {@link Runnable}), espera todas terminarem
     * com {@code join()} e devolve quantas reservas foram aceitas.
     */
    public static int simular(boolean sincronizado, int vagas, int candidatos) throws InterruptedException {
        Turma turma = new Turma(vagas);
        AtomicInteger aceitas = new AtomicInteger();

        Runnable tarefa = () -> {
            boolean ok = sincronizado ? turma.reservar() : turma.reservarSemSincronizar();
            if (ok) aceitas.incrementAndGet();
        };

        List<Thread> threads = new ArrayList<>();
        for (int i = 0; i < candidatos; i++) {
            Thread t = new Thread(tarefa, "candidato-" + i);
            threads.add(t);
            t.start(); // start() cria o fluxo de execução; run() chamaria a tarefa na thread atual
        }
        for (Thread t : threads) t.join(); // o main só segue quando todas terminarem
        return aceitas.get();
    }

    public static void main(String[] args) throws InterruptedException {
        int vagas = 5;
        int candidatos = 20;
        System.out.println("Vagas: " + vagas + " | candidatos simultâneos: " + candidatos);
        System.out.println("Sem synchronized: " + simular(false, vagas, candidatos) + " reservas aceitas (esperado: " + vagas + ")");
        System.out.println("Com synchronized: " + simular(true, vagas, candidatos) + " reservas aceitas (esperado: " + vagas + ")");
    }
}
