package br.com.caracursos.model;

import java.util.List;

/** Formato da listagem de trilhas do contrato. */
public record Trilha(int id, String titulo, String descricao, String nivel, String tema, List<String> competencias,
                     int totalCursos, int duracaoMinutos, int progresso, String status) {
}
