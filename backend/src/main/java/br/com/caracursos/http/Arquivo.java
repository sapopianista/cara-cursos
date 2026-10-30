package br.com.caracursos.http;

/** Resultado de uma rota que devolve um arquivo para download em vez de JSON. */
public record Arquivo(String nome, String tipoConteudo, byte[] conteudo) {
}
