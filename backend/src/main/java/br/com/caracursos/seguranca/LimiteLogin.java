package br.com.caracursos.seguranca;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Freia a força bruta no login: depois de {@link #MAX_FALHAS} senhas erradas para a mesma
 * chave (e-mail ou IP + e-mail) dentro de {@link #JANELA}, novas tentativas são recusadas
 * até a janela acabar.
 *
 * <p>Fica em memória (vale para uma instância da API; reiniciar zera os contadores).
 * E-mails inexistentes também contam, para a resposta não revelar quais contas existem.
 */
public final class LimiteLogin {

    public static final int MAX_FALHAS = 5;
    public static final Duration JANELA = Duration.ofMinutes(15);
    /** Teto rígido de entradas em memória para evitar crescimento ilimitado sob ataque. */
    public static final int LIMPAR_ACIMA_DE = 10_000;

    private record Falhas(int quantidade, Instant inicio) {
        boolean vencida(Instant agora) {
            return !agora.isBefore(inicio.plus(JANELA));
        }
    }

    private final Map<String, Falhas> porEmail = new ConcurrentHashMap<>();

    /** Tempo até poder tentar de novo; {@link Duration#ZERO} se não está bloqueado. */
    public Duration bloqueio(String email, Instant agora) {
        Falhas f = porEmail.get(email);
        if (f == null || f.vencida(agora) || f.quantidade() < MAX_FALHAS) return Duration.ZERO;
        return Duration.between(agora, f.inicio().plus(JANELA));
    }

    public void registrarFalha(String email, Instant agora) {
        if (!porEmail.containsKey(email) && porEmail.size() >= LIMPAR_ACIMA_DE) {
            porEmail.values().removeIf(f -> f.vencida(agora));
            while (porEmail.size() >= LIMPAR_ACIMA_DE) {
                var maisAntiga = porEmail.entrySet().stream()
                        .min(Comparator.comparing(e -> e.getValue().inicio()))
                        .orElse(null);
                if (maisAntiga == null) break;
                porEmail.remove(maisAntiga.getKey(), maisAntiga.getValue());
            }
        }
        porEmail.compute(email, (chave, f) -> f == null || f.vencida(agora)
                ? new Falhas(1, agora)
                : new Falhas(f.quantidade() + 1, f.inicio()));
    }

    /** Login certo zera as falhas daquele e-mail. */
    public void limpar(String email) {
        porEmail.remove(email);
    }

    public int tamanho() {
        return porEmail.size();
    }
}
