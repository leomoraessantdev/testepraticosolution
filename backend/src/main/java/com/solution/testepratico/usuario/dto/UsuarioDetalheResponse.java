package com.solution.testepratico.usuario.dto;

import com.solution.testepratico.endereco.dto.EnderecoResponse;
import com.solution.testepratico.usuario.Role;
import com.solution.testepratico.usuario.Usuario;

import java.time.Instant;
import java.util.List;

/**
 * Usuario com seus enderecos, para o GET de um usuario especifico.
 *
 * Separado de UsuarioResponse de proposito: a listagem nao carrega enderecos, e
 * o detalhe carrega. Um DTO unico com lista as vezes nula obrigaria o frontend
 * a adivinhar quando ela vem preenchida.
 *
 * Os enderecos chegam por consulta explicita no service, nao por associacao
 * mapeada na entidade. Duas queries previsiveis, nenhuma surpresa de lazy
 * loading fora da transacao.
 */
public record UsuarioDetalheResponse(
        Long id,
        String nome,
        String cpf,
        String email,
        Role role,
        boolean ativo,
        Instant criadoEm,
        List<EnderecoResponse> enderecos) {

    public static UsuarioDetalheResponse de(Usuario usuario, List<EnderecoResponse> enderecos) {
        return new UsuarioDetalheResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getCpf(),
                usuario.getEmail(),
                usuario.getRole(),
                usuario.isAtivo(),
                usuario.getCriadoEm(),
                enderecos);
    }
}
