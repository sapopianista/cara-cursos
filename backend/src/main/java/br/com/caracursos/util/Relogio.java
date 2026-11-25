package br.com.caracursos.util;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.ZoneId;

/** Hora atual e fuso da empresa num só lugar. */
public final class Relogio {

    /** Fuso padrão da empresa caso a configuração ainda não tenha sido carregada. */
    public static final ZoneId FUSO_EMPRESA = ZoneId.of("America/Sao_Paulo");

    private static volatile ZoneId fusoAtivo = FUSO_EMPRESA;

    private Relogio() {
    }

    /** Fuso horário configurado pela empresa (atualizado ao ler/salvar configurações). */
    public static ZoneId fuso() {
        return fusoAtivo;
    }

    public static void definirFuso(String fusoHorario) {
        if (fusoHorario != null && !fusoHorario.isBlank()) {
            fusoAtivo = ZoneId.of(fusoHorario.trim());
        }
    }

    /** Agora, sem frações de segundo (o DATETIME do MySQL guarda segundos inteiros). */
    public static Instant agora() {
        return Instant.ofEpochSecond(Instant.now().getEpochSecond());
    }

    /** Interpreta um identificador IANA, recorrendo a {@link #FUSO_EMPRESA} se ausente ou inválido. */
    public static ZoneId fuso(String id) {
        if (id == null || id.isBlank()) return FUSO_EMPRESA;
        try {
            return ZoneId.of(id.trim());
        } catch (DateTimeException e) {
            return FUSO_EMPRESA;
        }
    }
}
