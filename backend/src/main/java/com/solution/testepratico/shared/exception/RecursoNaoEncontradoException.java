package com.solution.testepratico.shared.exception;

/** Recurso inexistente. Traduzida em HTTP 404. */
public class RecursoNaoEncontradoException extends RuntimeException {

    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
