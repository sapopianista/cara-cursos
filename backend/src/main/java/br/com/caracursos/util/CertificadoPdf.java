package br.com.caracursos.util;

import java.io.ByteArrayOutputStream;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import br.com.caracursos.dao.CertificadoDAO.Certificado;

/**
 * Gera o certificado em PDF sem bibliotecas: uma página A4 deitada com as
 * fontes padrão do PDF (Helvetica), que todo leitor tem embutidas.
 */
public final class CertificadoPdf {

    private static final Charset WIN_ANSI = Charset.forName("windows-1252");
    private static final double LARGURA = 842;
    private static final double ALTURA = 595;
    private static final DateTimeFormatter DATA =
            DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy", Locale.of("pt", "BR")).withZone(Relogio.FUSO_EMPRESA);

    private CertificadoPdf() {
    }

    public static byte[] gerar(String nomeAluno, Certificado certificado, String empresa) {
        boolean nivel = certificado.origem().startsWith("Nível");
        StringBuilder c = new StringBuilder();
        // Moldura
        c.append("0.42 0.36 0.90 RG 3 w 28 28 ").append(LARGURA - 56).append(' ').append(ALTURA - 56).append(" re S\n");
        c.append("0.80 0.78 0.95 RG 1 w 40 40 ").append(LARGURA - 80).append(' ').append(ALTURA - 80).append(" re S\n");

        texto(c, "F2", 14, 0.42, 0.36, 0.90, ALTURA - 110, "CARA CURSOS");
        texto(c, "F2", 34, 0.10, 0.10, 0.15, ALTURA - 175, "Certificado de conclusão");
        texto(c, "F1", 15, 0.35, 0.35, 0.40, ALTURA - 230, "Certificamos que");
        texto(c, "F2", 30, 0.10, 0.10, 0.15, ALTURA - 280, nomeAluno);
        texto(c, "F1", 15, 0.35, 0.35, 0.40, ALTURA - 325,
                nivel ? "concluiu todos os cursos do " + certificado.origem().toLowerCase(Locale.ROOT)
                        : "concluiu o curso");
        texto(c, "F2", 22, 0.42, 0.36, 0.90, ALTURA - 365, certificado.titulo());
        texto(c, "F1", 12, 0.35, 0.35, 0.40, 120, "Emitido em " + DATA.format(certificado.emitidoEm())
                + (empresa == null ? "" : " · " + empresa));
        texto(c, "F1", 11, 0.50, 0.50, 0.55, 96, "Código de verificação: " + certificado.codigo());

        byte[] conteudo = c.toString().getBytes(WIN_ANSI);
        List<byte[]> objetos = new ArrayList<>();
        objetos.add(ascii("<< /Type /Catalog /Pages 2 0 R >>"));
        objetos.add(ascii("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"));
        objetos.add(ascii("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Contents 4 0 R "
                + "/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>"));
        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        stream.writeBytes(ascii("<< /Length " + conteudo.length + " >>\nstream\n"));
        stream.writeBytes(conteudo);
        stream.writeBytes(ascii("\nendstream"));
        objetos.add(stream.toByteArray());
        objetos.add(ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"));
        objetos.add(ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"));
        return montar(objetos);
    }

    /** Linha de texto centralizada horizontalmente. */
    private static void texto(StringBuilder c, String fonte, double tamanho, double r, double g, double b, double y,
                              String texto) {
        String limpo = texto.replace("\r", " ").replace("\n", " ");
        double largura = larguraAproximada(limpo, tamanho, fonte.equals("F2"));
        double x = Math.max(56, (LARGURA - largura) / 2);
        c.append(String.format(Locale.ROOT, "BT %.2f %.2f %.2f rg /%s %.1f Tf %.1f %.1f Td (%s) Tj ET%n",
                r, g, b, fonte, tamanho, x, y, escapar(limpo)));
    }

    /**
     * Largura média dos glifos da Helvetica (em milésimos do tamanho): suficiente
     * para centralizar sem embutir a tabela de métricas da fonte.
     */
    private static double larguraAproximada(String texto, double tamanho, boolean negrito) {
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

    private static String escapar(String s) {
        StringBuilder r = new StringBuilder();
        for (char ch : s.toCharArray()) {
            if (ch == '(' || ch == ')' || ch == '\\') r.append('\\');
            // Caracteres fora do WinAnsi viram "?" na conversão; o restante passa direto.
            r.append(ch);
        }
        return r.toString();
    }

    private static byte[] montar(List<byte[]> objetos) {
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

    private static byte[] ascii(String s) {
        return s.getBytes(StandardCharsets.ISO_8859_1);
    }
}
