package com.solution.testepratico.endereco.dto;

import com.solution.testepratico.endereco.Endereco;

/**
 * Projecao de leitura de Endereco.
 *
 * Nao expoe o usuario dono: o dono ja esta na propria URL da rota aninhada,
 * e serializar a associacao dispararia lazy loading fora da transacao.
 */
public record EnderecoResponse(
        Long id,
        String cep,
        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String cidade,
        String uf,
        boolean principal) {

    public static EnderecoResponse de(Endereco endereco) {
        return new EnderecoResponse(
                endereco.getId(),
                endereco.getCep(),
                endereco.getLogradouro(),
                endereco.getNumero(),
                endereco.getComplemento(),
                endereco.getBairro(),
                endereco.getCidade(),
                endereco.getUf(),
                endereco.isPrincipal());
    }
}
