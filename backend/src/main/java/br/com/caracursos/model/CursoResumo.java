package br.com.caracursos.model;

/** Referência curta a um curso, usada dentro de outras respostas: {@code { id, titulo, categoria }}. */
public record CursoResumo(int id, String titulo, String categoria) {
}
