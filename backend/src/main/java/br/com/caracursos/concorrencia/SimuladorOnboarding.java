package br.com.caracursos.concorrencia;

import java.io.PrintStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simula atendimentos simultâneos de onboarding/gestão de licenças usando {@link Thread},
 * {@code start()}, {@code join()}, {@code Thread.sleep()} e controle da seção crítica via
 * {@link ControleLicencas}.
 */
public class SimuladorOnboarding {

    public record Solicitacao(String gestor, String colaborador, String operacao) {
    }

    public record Resultado(int total, int aprovadas, int recusadas, int emUsoFinal, int disponiveisFinal) {
    }

    public static Resultado executar(ControleLicencas controle, List<Solicitacao> solicitacoes, long pausaMs,
                                     PrintStream saida) {
        Objects.requireNonNull(controle, "controle não pode ser nulo");
        Objects.requireNonNull(solicitacoes, "solicitacoes não pode ser nula");
        Objects.requireNonNull(saida, "saida não pode ser nula");

        AtomicInteger aprovadas = new AtomicInteger();
        AtomicInteger recusadas = new AtomicInteger();
        List<Thread> threads = new ArrayList<>(solicitacoes.size());

        for (Solicitacao s : solicitacoes) {
            Thread t = new Thread(() -> processar(controle, s, pausaMs, saida, aprovadas, recusadas));
            threads.add(t);
            t.start();
        }

        for (Thread t : threads) {
            try {
                t.join();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        return new Resultado(solicitacoes.size(), aprovadas.get(), recusadas.get(),
                controle.getEmUso(), controle.getDisponiveis());
    }

    private static void processar(ControleLicencas controle, Solicitacao s, long pausaMs, PrintStream saida,
                                  AtomicInteger aprovadas, AtomicInteger recusadas) {
        long threadId = Thread.currentThread().threadId();
        saida.printf("[Thread #%d] INÍCIO | gestor=%s | colaborador=%s | operação=%s%n",
                threadId, s.gestor(), s.colaborador(), s.operacao());

        if (pausaMs > 0) {
            try {
                Thread.sleep(pausaMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        boolean sucesso;
        if ("liberar".equalsIgnoreCase(s.operacao())) {
            sucesso = controle.liberar(s.gestor(), s.colaborador());
        } else {
            sucesso = controle.reservar(s.gestor(), s.colaborador());
        }

        if (sucesso) aprovadas.incrementAndGet();
        else recusadas.incrementAndGet();

        saida.printf("[Thread #%d] TÉRMINO | colaborador=%s | operação=%s | resultado=%s | disponíveis=%d%n",
                threadId, s.colaborador(), s.operacao(), sucesso ? "APROVADA" : "RECUSADA",
                controle.getDisponiveis());
    }

    public static void main(String[] args) {
        ControleLicencas controle = new ControleLicencas(10, 7);
        List<Solicitacao> lote = List.of(
                new Solicitacao("Beatriz (RH)", "Lucas Almeida", "reservar"),
                new Solicitacao("Tiago (Admin)", "Mariana Costa", "reservar"),
                new Solicitacao("Beatriz (RH)", "Rafael Souza", "reservar"),
                new Solicitacao("Tiago (Admin)", "Fernanda Lima", "reservar")
        );

        System.out.println("=== Simulação concorrente de licenças (3 disponíveis) ===");
        Resultado r = executar(controle, lote, 150, System.out);
        System.out.printf("=== Fim: total=%d, aprovadas=%d, recusadas=%d, emUso=%d, disponiveis=%d ===%n",
                r.total(), r.aprovadas(), r.recusadas(), r.emUsoFinal(), r.disponiveisFinal());
    }
}
