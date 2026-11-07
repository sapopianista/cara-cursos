package br.com.caracursos.util;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Relatório em PDF sem bibliotecas: A4 deitado, título, subtítulo e uma tabela que
 * continua nas páginas seguintes (o cabeçalho se repete). Textos longos são cortados com "…".
 */
public final class TabelaPdf {

    /** {@code peso}: fração da largura da tabela; {@code numerica}: alinha à direita. */
    public record Coluna(String titulo, double peso, boolean numerica) {
    }

    private static final double LARGURA = 842;
    private static final double ALTURA = 595;
    private static final double MARGEM = 40;
    private static final double TOPO_TABELA = ALTURA - 110;
    private static final double RODAPE = 50;
    private static final double LINHA = 18;
    private static final double FONTE = 9;
    private static final double RECUO = 5;
    private static final int LINHAS_POR_PAGINA = (int) ((TOPO_TABELA - RODAPE) / LINHA) - 1;

    private TabelaPdf() {
    }

    public static byte[] gerar(String titulo, String subtitulo, List<Coluna> colunas, List<List<String>> linhas) {
        double somaPesos = colunas.stream().mapToDouble(Coluna::peso).sum();
        double[] larguras = colunas.stream().mapToDouble(c -> c.peso() / somaPesos * (LARGURA - 2 * MARGEM)).toArray();

        List<String> paginas = new ArrayList<>();
        int total = Math.max(1, (linhas.size() + LINHAS_POR_PAGINA - 1) / LINHAS_POR_PAGINA);
        for (int p = 0; p < total; p++) {
            List<List<String>> trecho = linhas.subList(p * LINHAS_POR_PAGINA,
                    Math.min(linhas.size(), (p + 1) * LINHAS_POR_PAGINA));
            paginas.add(pagina(titulo, subtitulo, colunas, larguras, trecho, p + 1, total, linhas.isEmpty()));
        }

        // 1 catálogo, 2 árvore de páginas, 3 e 4 fontes; depois cada página e seu conteúdo.
        List<byte[]> objetos = new ArrayList<>();
        StringBuilder filhos = new StringBuilder();
        for (int p = 0; p < paginas.size(); p++) filhos.append(5 + 2 * p).append(" 0 R ");
        objetos.add(Pdf.ascii("<< /Type /Catalog /Pages 2 0 R >>"));
        objetos.add(Pdf.ascii("<< /Type /Pages /Kids [" + filhos.toString().trim() + "] /Count " + paginas.size()
                + " >>"));
        objetos.add(Pdf.ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"));
        objetos.add(Pdf.ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"));
        for (int p = 0; p < paginas.size(); p++) {
            objetos.add(Pdf.ascii("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Contents " + (6 + 2 * p)
                    + " 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>"));
            objetos.add(Pdf.stream(paginas.get(p)));
        }
        return Pdf.montar(objetos);
    }

    private static String pagina(String titulo, String subtitulo, List<Coluna> colunas, double[] larguras,
                                 List<List<String>> linhas, int numero, int total, boolean vazio) {
        StringBuilder c = new StringBuilder();
        texto(c, "F2", 18, 0.10, 0.10, 0.15, MARGEM, ALTURA - 55, titulo);
        texto(c, "F1", 10, 0.40, 0.40, 0.45, MARGEM, ALTURA - 75, subtitulo);
        texto(c, "F2", 9, 0.42, 0.36, 0.90, LARGURA - MARGEM - Pdf.larguraAproximada("CARA CURSOS", 9, true),
                ALTURA - 55, "CARA CURSOS");

        double y = TOPO_TABELA;
        retangulo(c, 0.93, 0.92, 0.99, MARGEM, y - LINHA, LARGURA - 2 * MARGEM, LINHA);
        linha(c, "F2", colunas, larguras, y, colunas.stream().map(Coluna::titulo).toList());
        for (int i = 0; i < linhas.size(); i++) {
            y -= LINHA;
            if (i % 2 == 1) retangulo(c, 0.97, 0.97, 0.98, MARGEM, y - LINHA, LARGURA - 2 * MARGEM, LINHA);
            linha(c, "F1", colunas, larguras, y, linhas.get(i));
        }
        if (vazio) {
            texto(c, "F1", 10, 0.40, 0.40, 0.45, MARGEM + RECUO, y - LINHA - 14,
                    "Nenhum dado para o período e os filtros escolhidos.");
        }
        String rodape = "Página " + numero + " de " + total;
        texto(c, "F1", 8, 0.50, 0.50, 0.55, LARGURA - MARGEM - Pdf.larguraAproximada(rodape, 8, false), 28, rodape);
        return c.toString();
    }

    private static void linha(StringBuilder c, String fonte, List<Coluna> colunas, double[] larguras, double y,
                              List<String> valores) {
        double x = MARGEM;
        for (int i = 0; i < colunas.size(); i++) {
            String valor = i < valores.size() && valores.get(i) != null ? valores.get(i) : "";
            String cabe = cortar(valor, larguras[i] - 2 * RECUO, fonte.equals("F2"));
            double tx = colunas.get(i).numerica()
                    ? x + larguras[i] - RECUO - Pdf.larguraAproximada(cabe, FONTE, fonte.equals("F2"))
                    : x + RECUO;
            texto(c, fonte, FONTE, 0.15, 0.15, 0.20, tx, y - LINHA + 6, cabe);
            x += larguras[i];
        }
    }

    private static String cortar(String texto, double largura, boolean negrito) {
        String limpo = texto.replace("\r", " ").replace("\n", " ");
        if (Pdf.larguraAproximada(limpo, FONTE, negrito) <= largura) return limpo;
        while (!limpo.isEmpty() && Pdf.larguraAproximada(limpo + "…", FONTE, negrito) > largura) {
            limpo = limpo.substring(0, limpo.length() - 1);
        }
        return limpo.stripTrailing() + "…";
    }

    private static void texto(StringBuilder c, String fonte, double tamanho, double r, double g, double b, double x,
                              double y, String texto) {
        c.append(String.format(Locale.ROOT, "BT %.2f %.2f %.2f rg /%s %.1f Tf %.1f %.1f Td (%s) Tj ET%n",
                r, g, b, fonte, tamanho, x, y, Pdf.escapar(texto.replace("\r", " ").replace("\n", " "))));
    }

    private static void retangulo(StringBuilder c, double r, double g, double b, double x, double y, double largura,
                                  double altura) {
        c.append(String.format(Locale.ROOT, "%.2f %.2f %.2f rg %.1f %.1f %.1f %.1f re f%n",
                r, g, b, x, y, largura, altura));
    }
}
