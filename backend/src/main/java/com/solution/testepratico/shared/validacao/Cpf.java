package com.solution.testepratico.shared.validacao;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Valida CPF pelos digitos verificadores.
 *
 * Anotacao propria em vez de um @Pattern de 11 digitos: formato correto nao
 * significa CPF valido. "11111111111" passa em qualquer regex e nao existe.
 *
 * Como constraint de Bean Validation, roda antes do metodo do controller e a
 * falha chega ao GlobalExceptionHandler junto das outras, no mesmo payload de
 * erro, sem if espalhado pelo service.
 */
@Documented
@Constraint(validatedBy = CpfValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface Cpf {

    String message() default "CPF invalido";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
