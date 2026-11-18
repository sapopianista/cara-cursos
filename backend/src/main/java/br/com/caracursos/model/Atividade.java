package br.com.caracursos.model;

import java.time.Instant;

/** Formato {@code Atividade} do contrato. {@code status}: pendente | entregue. */
public record Atividade(int id, int cursoId, String titulo, String descricao, Instant prazo, String status,
                        Instant entregueEm) {
}
