package com.solution.testepratico.shared.exception;

/** Requisicao bem formada que viola uma regra de negocio. Traduzida em HTTP 422. */
public class RegraDeNegocioException extends RuntimeException {

    public RegraDeNegocioException(String mensagem) {
        super(mensagem);
    }
}
