package com.solution.testepratico.shared.validacao;

import com.solution.testepratico.shared.CpfUtils;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class CpfValidator implements ConstraintValidator<Cpf, String> {

    @Override
    public boolean isValid(String valor, ConstraintValidatorContext contexto) {
        // Ausencia de valor e responsabilidade do @NotBlank, incluindo string
        // vazia ou so com espacos. Reprovar aqui tambem produziria DUAS
        // mensagens para o mesmo campo: "CPF e obrigatorio" e "CPF invalido".
        if (valor == null || valor.isBlank()) {
            return true;
        }
        return CpfUtils.valido(valor);
    }
}
