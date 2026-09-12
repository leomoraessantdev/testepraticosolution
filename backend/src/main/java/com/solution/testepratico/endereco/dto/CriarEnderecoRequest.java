package com.solution.testepratico.endereco.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * O CEP aceita mascara na entrada (o frontend manda formatado) e e normalizado
 * no service antes de tocar o banco. Validar so o formato aqui nao substitui o
 * CHECK da tabela: Bean Validation protege contra cliente desatento, a
 * constraint protege contra qualquer outro escritor.
 *
 * "principal" e opcional. Quando ausente ou falso, a regra do primeiro endereco
 * ainda pode promover este endereco automaticamente.
 */
public record CriarEnderecoRequest(

        @NotBlank(message = "CEP e obrigatorio")
        @Pattern(regexp = "^[0-9]{5}-?[0-9]{3}$", message = "CEP deve ter 8 digitos")
        String cep,

        @NotBlank(message = "Logradouro e obrigatorio")
        @Size(max = 255, message = "Logradouro deve ter no maximo 255 caracteres")
        String logradouro,

        @NotBlank(message = "Numero e obrigatorio")
        @Size(max = 20, message = "Numero deve ter no maximo 20 caracteres")
        String numero,

        @Size(max = 100, message = "Complemento deve ter no maximo 100 caracteres")
        String complemento,

        @NotBlank(message = "Bairro e obrigatorio")
        @Size(max = 100, message = "Bairro deve ter no maximo 100 caracteres")
        String bairro,

        @NotBlank(message = "Cidade e obrigatoria")
        @Size(max = 100, message = "Cidade deve ter no maximo 100 caracteres")
        String cidade,

        @NotBlank(message = "UF e obrigatoria")
        @Pattern(regexp = "^[A-Za-z]{2}$", message = "UF deve ter 2 letras")
        String uf,

        Boolean principal) {
}
