package br.com.caracursos.util;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;

/**
 * Períodos de análise aceitos pela API. É um {@code enum} com campos e métodos:
 * cada constante carrega seu próprio id, rótulo e duração, o que substitui os
 * mapas e {@code if}s soltos que existiam em mais de um lugar.
 */
public enum Periodo {

    SETE_DIAS("7dias", "Últimos 7 dias", 7),
    TRINTA_DIAS("30dias", "Últimos 30 dias", 30),
    TRIMESTRE("trimestre", "Últimos 3 meses", 90),
    ANO("ano", "Últimos 12 meses", 365);

    private final String id;
    private final String rotulo;
    private final int dias;

    Periodo(String id, String rotulo, int dias) {
        this.id = id;
        this.rotulo = rotulo;
        this.dias = dias;
    }

    public String id() {
        return id;
    }

    public String rotulo() {
        return rotulo;
    }

    /** Início do período que termina em {@code fim}. */
    public Instant desde(Instant fim) {
        return fim.minus(Duration.ofDays(dias));
    }

    /** Período com esse id, ou {@code null} se não existir. */
    public static Periodo deId(String id) {
        return Arrays.stream(values()).filter(p -> p.id.equals(id)).findFirst().orElse(null);
    }
}
