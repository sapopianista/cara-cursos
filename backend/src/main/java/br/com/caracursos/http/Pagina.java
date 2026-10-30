package br.com.caracursos.http;

import java.util.List;

/** Resposta paginada do contrato: {@code { itens, total, pagina, porPagina, totalPaginas }}. */
public record Pagina<T>(List<T> itens, int total, int pagina, int porPagina, int totalPaginas) {

    /** Limites e deslocamento de uma consulta paginada, já corrigidos para a faixa válida. */
    public record Recorte(int pagina, int porPagina, int totalPaginas) {
        public int deslocamento() {
            return (pagina - 1) * porPagina;
        }
    }

    public static final int POR_PAGINA_MAXIMO = 100;

    /** Mesma regra do mock: página fora da faixa vai para a primeira ou a última. */
    public static Recorte recortar(int paginaPedida, int porPaginaPedido, int total) {
        int porPagina = Math.clamp(porPaginaPedido, 1, POR_PAGINA_MAXIMO);
        int totalPaginas = Math.max(1, (int) Math.ceil(total / (double) porPagina));
        int pagina = Math.clamp(paginaPedida, 1, totalPaginas);
        return new Recorte(pagina, porPagina, totalPaginas);
    }

    public static <T> Pagina<T> de(List<T> itens, int total, Recorte recorte) {
        return new Pagina<>(itens, total, recorte.pagina(), recorte.porPagina(), recorte.totalPaginas());
    }
}
