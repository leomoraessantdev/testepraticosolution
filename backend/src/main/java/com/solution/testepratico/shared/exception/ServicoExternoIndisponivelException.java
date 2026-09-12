package com.solution.testepratico.shared.exception;

/**
 * Dependencia externa fora do ar, lenta demais ou respondendo erro.
 * Traduzida em HTTP 503.
 *
 * 503 e nao 500: o defeito nao e nosso, e a condicao e transitoria. O cliente
 * pode tentar de novo, e o status diz isso.
 */
public class ServicoExternoIndisponivelException extends RuntimeException {

    public ServicoExternoIndisponivelException(String servico, Throwable causa) {
        super("Servico " + servico + " indisponivel no momento.", causa);
    }
}
