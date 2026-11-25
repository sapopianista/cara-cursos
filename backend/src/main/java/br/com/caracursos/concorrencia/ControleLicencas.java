package br.com.caracursos.concorrencia;

/**
 * Controla o saldo de licenças corporativas em memória de forma segura para acesso
 * concorrente entre múltiplos gestores, protegendo a seção crítica com {@code synchronized}.
 */
public class ControleLicencas {

    private final int contratadas;
    private int emUso;

    public ControleLicencas(int contratadas, int emUso) {
        if (contratadas < 0 || emUso < 0 || emUso > contratadas) {
            throw new IllegalArgumentException(
                    "Valores inválidos de licenças: contratadas=" + contratadas + ", emUso=" + emUso);
        }
        this.contratadas = contratadas;
        this.emUso = emUso;
    }

    /**
     * Tenta reservar uma licença para um novo colaborador.
     * Seção crítica sincronizada: evita condição de corrida acima do teto contratado.
     */
    public synchronized boolean reservar(String responsavel, String colaborador) {
        if (emUso >= contratadas) {
            return false;
        }
        emUso++;
        return true;
    }

    /**
     * Libera uma licença em uso (ex.: inativação de colaborador).
     */
    public synchronized boolean liberar(String responsavel, String colaborador) {
        if (emUso <= 0) {
            return false;
        }
        emUso--;
        return true;
    }

    public synchronized int getContratadas() {
        return contratadas;
    }

    public synchronized int getEmUso() {
        return emUso;
    }

    public synchronized int getDisponiveis() {
        return contratadas - emUso;
    }
}
