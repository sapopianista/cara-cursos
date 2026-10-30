package br.com.caracursos.http;

import java.util.Map;

/**
 * Erro de negócio que vira a resposta JSON do contrato:
 * {@code { "mensagem": "...", "codigo": "...", "campos": { ... } }}.
 */
public class ApiException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final int status;
    private final String codigo;
    private final transient Map<String, String> campos;

    public ApiException(int status, String codigo, String mensagem, Map<String, String> campos) {
        super(mensagem);
        this.status = status;
        this.codigo = codigo;
        this.campos = campos == null || campos.isEmpty() ? null : Map.copyOf(campos);
    }

    public static ApiException requisicaoInvalida(String mensagem) {
        return new ApiException(400, "REQUISICAO_INVALIDA", mensagem, null);
    }

    public static ApiException naoAutorizado(String codigo, String mensagem) {
        return new ApiException(401, codigo, mensagem, null);
    }

    public static ApiException proibido(String mensagem) {
        return new ApiException(403, "SEM_PERMISSAO", mensagem, null);
    }

    public static ApiException naoEncontrado(String mensagem) {
        return new ApiException(404, "NAO_ENCONTRADO", mensagem, null);
    }

    public static ApiException conflito(String codigo, String mensagem) {
        return new ApiException(409, codigo, mensagem, null);
    }

    /** 422 com erros por campo (exibidos embaixo de cada campo do formulário). */
    public static ApiException validacao(Map<String, String> campos) {
        return validacao("Revise os campos destacados.", campos);
    }

    public static ApiException validacao(String mensagem, Map<String, String> campos) {
        return new ApiException(422, "VALIDACAO", mensagem, campos);
    }

    public int getStatus() {
        return status;
    }

    public String getCodigo() {
        return codigo;
    }

    public Map<String, String> getCampos() {
        return campos;
    }
}
