package br.com.caracursos.model;

import java.time.Instant;

/** Formato {@code Notificacao} do contrato. */
public record Notificacao(int id, String titulo, String descricao, String link, boolean lida, Instant criadaEm) {
}
