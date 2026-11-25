package br.com.caracursos.demo;

/**
 * Turma com número limitado de vagas, usada nas demonstrações de concorrência (Aula 09)
 * e de sockets (Aula 10). Não faz parte da API REST.
 *
 * <p>O estado compartilhado é {@code livres}. Reservar é "verificar e depois alterar":
 * se duas threads verificam ao mesmo tempo, as duas passam e a turma estoura as vagas
 * (condição de corrida). {@link #reservar()} evita isso com {@code synchronized}.
 */
public class Turma {

    private int livres;

    public Turma(int vagas) {
        this.livres = vagas;
    }

    /** Versão SEM proteção, só para mostrar o problema. A pausa aumenta a chance de a corrida acontecer. */
    public boolean reservarSemSincronizar() {
        if (livres > 0) {
            pausar();
            livres--;
            return true;
        }
        return false;
    }

    /** Versão correta: o monitor (lock) do objeto garante que uma thread por vez execute o método. */
    public synchronized boolean reservar() {
        if (livres > 0) {
            pausar();
            livres--;
            return true;
        }
        return false;
    }

    public synchronized int vagasLivres() {
        return livres;
    }

    private static void pausar() {
        try {
            Thread.sleep(2); // simula o tempo de gravar a reserva
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
