package com.solution.testepratico.shared.exception;

/**
 * CPF ja cadastrado. Traduzida em HTTP 409.
 *
 * 409 e nao 400: a requisicao esta correta, o conflito e com o estado atual do
 * sistema. O cliente nao tem como consertar o corpo da requisicao.
 */
public class CpfDuplicadoException extends RuntimeException {

    public CpfDuplicadoException() {
        super("Ja existe um usuario cadastrado com este CPF.");
    }
}
