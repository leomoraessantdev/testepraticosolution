package com.solution.testepratico.usuario.dto;

import com.solution.testepratico.usuario.Role;
import com.solution.testepratico.usuario.Usuario;

import java.time.Instant;
import java.time.LocalDate;

/**
 * O que sai na API. Nao existe campo de senha aqui — nao ha como vazar hash
 * por esquecimento, porque a classe simplesmente nao tem onde guardar.
 *
 * Esse e o motivo de nunca serializar a entidade direto.
 */
public record UsuarioResponse(
        Long id,
        String nome,
        String cpf,
        String email,
        LocalDate dataNascimento,
        Role role,
        boolean ativo,
        Instant criadoEm,
        long totalEnderecos) {

    /**
     * A contagem vem de fora porque nao esta na entidade: carrega-la por
     * usuario, aqui dentro, seria exatamente o N+1 que a consulta agregada do
     * EnderecoRepository existe para evitar.
     */
    public static UsuarioResponse de(Usuario usuario, long totalEnderecos) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getCpf(),
                usuario.getEmail(),
                usuario.getDataNascimento(),
                usuario.getRole(),
                usuario.isAtivo(),
                usuario.getCriadoEm(),
                totalEnderecos);
    }
}
