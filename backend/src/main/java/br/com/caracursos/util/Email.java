package br.com.caracursos.util;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/** Validação e normalização de e-mails corporativos. */
public final class Email {

    private static final Pattern PADRAO = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private Email() {
    }

    public static boolean valido(String email) {
        return email != null && email.length() <= 160 && PADRAO.matcher(email).matches();
    }

    public static String normalizar(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    /** Separa lista de domínios por vírgula, em minúsculas e sem repetição. */
    public static List<String> dominios(String valor) {
        if (valor == null || valor.isBlank()) return List.of();
        List<String> lista = new ArrayList<>();
        for (String parte : valor.split(",")) {
            String d = parte.trim().toLowerCase(Locale.ROOT);
            if (!d.isEmpty() && !lista.contains(d)) lista.add(d);
        }
        return List.copyOf(lista);
    }

    /** Confere se o domínio do e-mail pertence à lista autorizada (lista vazia libera qualquer um). */
    public static boolean dominioAutorizado(String email, List<String> dominiosAutorizados) {
        if (dominiosAutorizados == null || dominiosAutorizados.isEmpty()) return true;
        if (email == null) return false;
        int arroba = email.lastIndexOf('@');
        if (arroba < 0 || arroba == email.length() - 1) return false;
        String dominio = email.substring(arroba + 1).trim().toLowerCase(Locale.ROOT);
        return dominiosAutorizados.contains(dominio);
    }
}
