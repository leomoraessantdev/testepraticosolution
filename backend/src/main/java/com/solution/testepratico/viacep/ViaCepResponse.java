package com.solution.testepratico.viacep;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Resposta crua do ViaCEP. Fica no pacote de integracao e nao vaza para a
 * nossa API: o formato e deles, pode mudar, e usa nomes proprios
 * ("localidade" em vez de "cidade").
 *
 * ignoreUnknown porque o ViaCEP devolve campos que nao usamos (ibge, gia, ddd,
 * siafi, unidade, estado, regiao). Sem isso, um campo novo do lado deles
 * quebraria nossa desserializacao.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ViaCepResponse(
        String cep,
        String logradouro,
        String complemento,
        String bairro,
        String localidade,
        String uf,
        Boolean erro) {

    /**
     * A ARMADILHA do ViaCEP: CEP inexistente NAO devolve 404. Devolve HTTP 200
     * com corpo {"erro": "true"}. Checar apenas o status code deixaria passar
     * um endereco totalmente vazio como se fosse valido.
     *
     * A checagem de cep nulo e redundancia proposital: versoes diferentes da
     * API ja devolveram o campo erro como string e como booleano.
     */
    public boolean naoEncontrado() {
        return Boolean.TRUE.equals(erro) || cep == null || cep.isBlank();
    }
}
