package br.com.caracursos.util;

import java.io.ByteArrayOutputStream;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Peças comuns para montar PDF sem bibliotecas (usadas por {@link CertificadoPdf} e {@link TabelaPdf}):
 * fontes padrão Helvetica, que todo leitor tem embutidas, com texto em WinAnsi.
 */
final class Pdf {

    static final Charset WIN_ANSI = Charset.forName("windows-1252");

    private Pdf() {
    }

    /**
     * Largura média dos glifos da Helvetica (em milésimos do tamanho): suficiente
     * para centralizar e cortar texto sem embutir a tabela de métricas da fonte.
     */
    static double larguraAproximada(String texto, double tamanho, boolean negrito) {
        double total = 0;
        for (char ch : texto.toCharArray()) {
            double w;
            if (ch == ' ') w = 278;
            else if ("il.,:;'|!".indexOf(ch) >= 0) w = 250;
            else if (Character.isUpperCase(ch)) w = 690;
            else if (Character.isDigit(ch)) w = 556;
            else if ("mwMW".indexOf(ch) >= 0) w = 833;
            else w = 520;
            total += negrito ? w * 1.06 : w;
        }
        return total * tamanho / 1000;
    }

    static String escapar(String s) {
        StringBuilder r = new StringBuilder();
        for (char ch : s.toCharArray()) {
            if (ch == '(' || ch == ')' || ch == '\\') r.append('\\');
            // Caracteres fora do WinAnsi viram "?" na conversão; o restante passa direto.
            r.append(ch);
        }
        return r.toString();
    }

    /** Objeto de conteúdo de página (stream). */
    static byte[] stream(String conteudo) {
        byte[] bytes = conteudo.getBytes(WIN_ANSI);
        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        stream.writeBytes(ascii("<< /Length " + bytes.length + " >>\nstream\n"));
        stream.writeBytes(bytes);
        stream.writeBytes(ascii("\nendstream"));
        return stream.toByteArray();
    }

    /** Numera os objetos (1, 2, 3…), escreve a tabela xref e o trailer. O objeto 1 é o catálogo. */
    static byte[] montar(List<byte[]> objetos) {
        ByteArrayOutputStream pdf = new ByteArrayOutputStream();
        pdf.writeBytes(ascii("%PDF-1.4\n%âãÏÓ\n"));
        List<Integer> posicoes = new ArrayList<>();
        for (int i = 0; i < objetos.size(); i++) {
            posicoes.add(pdf.size());
            pdf.writeBytes(ascii((i + 1) + " 0 obj\n"));
            pdf.writeBytes(objetos.get(i));
            pdf.writeBytes(ascii("\nendobj\n"));
        }
        int xref = pdf.size();
        StringBuilder tabela = new StringBuilder("xref\n0 " + (objetos.size() + 1) + "\n0000000000 65535 f \n");
        for (int p : posicoes) tabela.append(String.format("%010d 00000 n \n", p));
        tabela.append("trailer\n<< /Size ").append(objetos.size() + 1).append(" /Root 1 0 R >>\nstartxref\n")
                .append(xref).append("\n%%EOF\n");
        pdf.writeBytes(ascii(tabela.toString()));
        return pdf.toByteArray();
    }

    static byte[] ascii(String s) {
        return s.getBytes(StandardCharsets.ISO_8859_1);
    }
}
