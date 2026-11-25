package br.com.caracursos.model;

/** Formato {@code Aula} do contrato. {@code status}: concluida | em_andamento | pendente. */
public record Aula(int id, int ordem, String titulo, String tipo, int duracaoSegundos, int posicaoSegundos,
                   String status, String videoUrl, String posterUrl, String legendaUrl) {
}
