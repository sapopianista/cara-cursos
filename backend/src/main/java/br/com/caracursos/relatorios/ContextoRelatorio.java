package br.com.caracursos.relatorios;

import java.time.Instant;

import br.com.caracursos.dao.RelatorioDAO;

/**
 * Tudo o que um gerador precisa para montar um relatório. Reunir os dados num
 * único objeto permite que todos os geradores tenham a mesma assinatura (requisito do Strategy).
 */
public record ContextoRelatorio(RelatorioDAO dao, Instant desde, String departamento, String titulo,
                                String subtitulo) {
}
