package br.com.caracursos.model;

import java.security.SecureRandom;
import java.text.Normalizer;
import java.time.Instant;
import java.util.Locale;

/** Certificado emitido (tabela {@code certificados}). */
public record Certificado(int id, String titulo, String origem, Instant emitidoEm, String codigo, String url) {

    private static final SecureRandom ALEATORIO = new SecureRandom();

    public static Certificado de(int id, String titulo, String origem, Instant emitidoEm, String codigo) {
        return new Certificado(id, titulo, origem, emitidoEm, codigo, "/certificados/" + id + "/arquivo");
    }

    /** Ex.: {@code CC-4821-SEG} (4 dígitos sorteados + 3 primeiras letras do título). */
    public static String novoCodigo(String titulo) {
        String letras = Normalizer.normalize(titulo, Normalizer.Form.NFD).replaceAll("[^A-Za-z]", "")
                .toUpperCase(Locale.ROOT);
        letras = (letras + "XXX").substring(0, 3);
        return "CC-" + (1000 + ALEATORIO.nextInt(9000)) + "-" + letras;
    }
}
