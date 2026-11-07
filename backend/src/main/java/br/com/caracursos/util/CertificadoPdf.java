package br.com.caracursos.util;

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

        List<byte[]> objetos = new ArrayList<>();
        objetos.add(Pdf.ascii("<< /Type /Catalog /Pages 2 0 R >>"));
        objetos.add(Pdf.ascii("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"));
        objetos.add(Pdf.ascii("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Contents 4 0 R "
                + "/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>"));
        objetos.add(Pdf.stream(c.toString()));
        objetos.add(Pdf.ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"));
        objetos.add(Pdf.ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"));
        return Pdf.montar(objetos);
    }

    /** Linha de texto centralizada horizontalmente. */
    private static void texto(StringBuilder c, String fonte, double tamanho, double r, double g, double b, double y,
                              String texto) {
        String limpo = texto.replace("\r", " ").replace("\n", " ");
        double largura = Pdf.larguraAproximada(limpo, tamanho, fonte.equals("F2"));
        double x = Math.max(56, (LARGURA - largura) / 2);
        c.append(String.format(Locale.ROOT, "BT %.2f %.2f %.2f rg /%s %.1f Tf %.1f %.1f Td (%s) Tj ET%n",
                r, g, b, fonte, tamanho, x, y, Pdf.escapar(limpo)));
    }
}
