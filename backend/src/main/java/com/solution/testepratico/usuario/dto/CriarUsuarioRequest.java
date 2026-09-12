package com.solution.testepratico.usuario.dto;

import com.solution.testepratico.shared.validacao.Cpf;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * NAO tem campo role, e isso e seguranca, nao esquecimento.
 *
 * Se tivesse, qualquer pessoa se cadastraria mandando "role":"ADMIN" no corpo.
 * O perfil e sempre USUARIO_COMUM no cadastro; o admin inicial nasce por
 * migration de seed e promocao so por outro admin.
 *
 * A data de nascimento e obrigatoria (requisito do documento), precisa ser uma
 * data real e nao pode estar no futuro. Formato ISO aaaa-mm-dd: uma string como
 * "31/02/2020" nem chega ao @PastOrPresent, morre antes na desserializacao do
 * Jackson e vira 400 pelo handler de corpo ilegivel.
 */
public record CriarUsuarioRequest(

        @NotBlank(message = "Nome e obrigatorio")
        @Size(max = 150, message = "Nome deve ter no maximo 150 caracteres")
        String nome,

        @NotBlank(message = "CPF e obrigatorio")
        @Cpf
        String cpf,

        @NotBlank(message = "E-mail e obrigatorio")
        @Email(message = "E-mail invalido")
        @Size(max = 255, message = "E-mail deve ter no maximo 255 caracteres")
        String email,

        @NotNull(message = "Data de nascimento e obrigatoria")
        @PastOrPresent(message = "Data de nascimento nao pode ser futura")
        LocalDate dataNascimento,

        @NotBlank(message = "Senha e obrigatoria")
        @Size(min = 8, max = 72, message = "Senha deve ter entre 8 e 72 caracteres")
        String senha) {
}
