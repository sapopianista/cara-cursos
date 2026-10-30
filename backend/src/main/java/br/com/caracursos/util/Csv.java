package br.com.caracursos.util;

import java.nio.charset.StandardCharsets;

/**
 * CSV que abre direto no Excel em português: UTF-8 com BOM, separador {@code ;}
 * e quebra de linha CRLF. Campos com {@code ;}, aspas ou quebras vão entre aspas.
 */
public final class Csv {

    private static final String BOM = "﻿";

    private final StringBuilder texto = new StringBuilder(BOM);

    public Csv(String... cabecalho) {
        linha((Object[]) cabecalho);
    }

    public Csv linha(Object... valores) {
        for (int i = 0; i < valores.length; i++) {
            if (i > 0) texto.append(';');
            texto.append(campo(valores[i]));
        }
        texto.append("\r\n");
        return this;
    }

    public byte[] bytes() {
        return texto.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static String campo(Object valor) {
        if (valor == null) return "";
        String s = valor.toString();
        // Evita que o Excel interprete o conteúdo como fórmula (injeção de CSV).
        if (!s.isEmpty() && "=+-@".indexOf(s.charAt(0)) >= 0) s = "'" + s;
        if (s.contains(";") || s.contains("\"") || s.contains("\n") || s.contains("\r")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }
}
