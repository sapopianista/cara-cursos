package br.com.caracursos.model;

import java.time.Instant;

/** Formato {@code Gestor} do contrato. {@code ultimoAcesso} só vem depois que o convite foi aceito. */
public record Gestor(int id, int colaboradorId, String nome, String email, String departamento, String papel,
                     String status, Instant convidadoEm, Instant ultimoAcesso) {
}
