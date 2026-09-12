package com.solution.testepratico.shared.exception;

/** Autenticado, porem sem permissao sobre o recurso. Traduzida em HTTP 403. */
public class AcessoNegadoException extends RuntimeException {

    public AcessoNegadoException(String mensagem) {
        super(mensagem);
    }
}
