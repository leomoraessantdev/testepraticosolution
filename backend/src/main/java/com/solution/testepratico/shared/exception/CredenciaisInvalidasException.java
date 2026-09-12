package com.solution.testepratico.shared.exception;

/**
 * Falha de login. Traduzida em HTTP 401 com mensagem generica.
 *
 * Proposital: nao existe excecao separada para "CPF nao existe" e "senha
 * errada". Distinguir as duas entregaria ao atacante um oraculo para descobrir
 * quais CPFs estao cadastrados.
 */
public class CredenciaisInvalidasException extends RuntimeException {

    public CredenciaisInvalidasException() {
        super("CPF ou senha invalidos.");
    }
}
