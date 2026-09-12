package com.solution.testepratico.shared.exception;

/** CEP consultado nao existe na base dos Correios. Traduzida em HTTP 404. */
public class CepNaoEncontradoException extends RuntimeException {

    public CepNaoEncontradoException(String cep) {
        super("CEP " + cep + " nao encontrado.");
    }
}
