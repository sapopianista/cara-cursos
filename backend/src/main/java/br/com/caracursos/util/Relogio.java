package br.com.caracursos.util;

import java.time.Instant;
import java.time.ZoneId;

/** Hora atual e fuso da empresa num só lugar. */
public final class Relogio {

    /** Fuso usado para "hoje" e turnos do dia (configuração da empresa no frontend). */
    public static final ZoneId FUSO_EMPRESA = ZoneId.of("America/Sao_Paulo");

    private Relogio() {
    }

    /** Agora, sem frações de segundo (o DATETIME do MySQL guarda segundos inteiros). */
    public static Instant agora() {
        return Instant.ofEpochSecond(Instant.now().getEpochSecond());
    }
}
