package com.solution.testepratico.endereco.dto;

import com.solution.testepratico.endereco.Endereco;

/**
 * Usado apenas na listagem global do admin. Carrega o dono, porque nessa rota
 * o endereco aparece fora do contexto de um usuario e sem isso a lista seria
 * inutil.
 *
 * Depende de a consulta ter feito JOIN FETCH do usuario: acessar
 * getUsuario().getNome() sobre um proxy lazy dispararia uma query por linha.
 */
public record EnderecoAdminResponse(
        Long id,
        Long usuarioId,
        String usuarioNome,
        String cep,
        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String cidade,
        String uf,
        boolean principal) {

    public static EnderecoAdminResponse de(Endereco e) {
        return new EnderecoAdminResponse(
                e.getId(),
                e.getUsuario().getId(),
                e.getUsuario().getNome(),
                e.getCep(),
                e.getLogradouro(),
                e.getNumero(),
                e.getComplemento(),
                e.getBairro(),
                e.getCidade(),
                e.getUf(),
                e.isPrincipal());
    }
}
