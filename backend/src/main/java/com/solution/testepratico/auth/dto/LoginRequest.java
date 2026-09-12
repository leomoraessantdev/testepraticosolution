package com.solution.testepratico.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Record: imutavel, sem setter, sem Lombok. As anotacoes de validacao rodam
 * antes do metodo do controller, por causa do @Valid na assinatura.
 *
 * Aqui so se exige "nao vazio". Validar formato de CPF no login nao protege
 * nada e ainda entrega ao atacante a informacao de quais formatos o sistema
 * aceita.
 */
public record LoginRequest(
        @NotBlank(message = "CPF e obrigatorio")
        String cpf,

        @NotBlank(message = "Senha e obrigatoria")
        String senha) {
}
