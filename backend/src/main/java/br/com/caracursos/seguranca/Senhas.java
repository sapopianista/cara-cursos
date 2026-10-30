package br.com.caracursos.seguranca;

import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import java.util.Base64;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

/**
 * Hash de senhas com PBKDF2-HMAC-SHA256 (só a biblioteca padrão do Java).
 *
 * <p>Formato guardado em {@code usuarios.senha}:
 * {@code pbkdf2_sha256$<iterações>$<salt base64>$<hash base64>}.
 */
public final class Senhas {

    private static final String ALGORITMO = "PBKDF2WithHmacSHA256";
    private static final String PREFIXO = "pbkdf2_sha256";
    /** Recomendação da OWASP (2023) para PBKDF2-HMAC-SHA256. */
    private static final int ITERACOES = 600_000;
    private static final int BYTES_SALT = 16;
    private static final int BITS_HASH = 256;
    private static final SecureRandom ALEATORIO = new SecureRandom();

    /** Usado quando o e-mail não existe, para o tempo de resposta não revelar isso. */
    private static final String HASH_FICTICIO = gerar("senha-ficticia-para-tempo-constante");

    private Senhas() {
    }

    public static String gerar(String senha) {
        byte[] salt = new byte[BYTES_SALT];
        ALEATORIO.nextBytes(salt);
        byte[] hash = derivar(senha.toCharArray(), salt, ITERACOES);
        Base64.Encoder b64 = Base64.getEncoder();
        return PREFIXO + "$" + ITERACOES + "$" + b64.encodeToString(salt) + "$" + b64.encodeToString(hash);
    }

    /** Compara em tempo constante. {@code hashGuardado} nulo ou malformado = senha incorreta. */
    public static boolean verificar(String senha, String hashGuardado) {
        if (senha == null) return false;
        String[] partes = (hashGuardado == null ? HASH_FICTICIO : hashGuardado).split("\\$");
        if (partes.length != 4 || !PREFIXO.equals(partes[0])) return false;
        try {
            int iteracoes = Integer.parseInt(partes[1]);
            Base64.Decoder b64 = Base64.getDecoder();
            byte[] salt = b64.decode(partes[2]);
            byte[] esperado = b64.decode(partes[3]);
            byte[] calculado = derivar(senha.toCharArray(), salt, iteracoes);
            return MessageDigest.isEqual(esperado, calculado) && hashGuardado != null;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private static byte[] derivar(char[] senha, byte[] salt, int iteracoes) {
        try {
            KeySpec spec = new PBEKeySpec(senha, salt, iteracoes, BITS_HASH);
            return SecretKeyFactory.getInstance(ALGORITMO).generateSecret(spec).getEncoded();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("PBKDF2 indisponível nesta JVM", e);
        }
    }
}
