package br.com.caracursos.model;

import java.time.Instant;

/** Formato {@code Colaborador} do contrato. */
public record Colaborador(int id, String matricula, String nome, String email, String cargo, String departamento,
                          int nivel, int progresso, int cursosConcluidos, String status, Instant ultimoAcesso,
                          Instant criadoEm) {
}
