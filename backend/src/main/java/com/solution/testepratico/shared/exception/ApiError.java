package com.solution.testepratico.shared.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

/**
 * Formato unico de erro da API. O frontend trata um shape so, em vez de
 * adivinhar entre o payload padrao do Spring, o do Tomcat e os nossos.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        Instant timestamp,
        int status,
        String erro,
        String mensagem,
        String caminho,
        List<CampoInvalido> campos) {

    public record CampoInvalido(String campo, String mensagem) {
    }

    public static ApiError de(int status, String erro, String mensagem, String caminho) {
        return new ApiError(Instant.now(), status, erro, mensagem, caminho, null);
    }

    public static ApiError comCampos(int status, String erro, String mensagem,
                                     String caminho, List<CampoInvalido> campos) {
        return new ApiError(Instant.now(), status, erro, mensagem, caminho, campos);
    }
}
