package br.com.caracursos.util;

/** Validação e formatação de CNPJ (mesma regra de {@code cnpjValido} em src/lib/validacao.js). */
public final class Cnpj {

    private static final int[] PESOS_1 = { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
    private static final int[] PESOS_2 = { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };

    private Cnpj() {
    }

    /** Aceita com ou sem máscara; confere os dois dígitos verificadores. */
    public static boolean valido(String valor) {
        if (valor == null) return false;
        String d = valor.replaceAll("\\D", "");
        if (d.length() != 14 || d.chars().distinct().count() == 1) return false;
        int d1 = digito(d, PESOS_1);
        int d2 = digito(d, PESOS_2);
        return d.charAt(12) - '0' == d1 && d.charAt(13) - '0' == d2;
    }

    /** {@code 11222333000181} → {@code 11.222.333/0001-81}. Só para CNPJ válido. */
    public static String formatar(String valor) {
        String d = valor.replaceAll("\\D", "");
        return d.substring(0, 2) + "." + d.substring(2, 5) + "." + d.substring(5, 8) + "/" + d.substring(8, 12)
                + "-" + d.substring(12);
    }

    private static int digito(String d, int[] pesos) {
        int soma = 0;
        for (int i = 0; i < pesos.length; i++) soma += (d.charAt(i) - '0') * pesos[i];
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}
