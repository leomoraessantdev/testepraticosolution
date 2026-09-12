package com.solution.testepratico.shared.exception;

/** E-mail ja cadastrado. Traduzida em HTTP 409. */
public class EmailDuplicadoException extends RuntimeException {

    public EmailDuplicadoException() {
        super("Ja existe um usuario cadastrado com este e-mail.");
    }
}
