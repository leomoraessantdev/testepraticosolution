package com.solution.testepratico.viacep;

import com.solution.testepratico.shared.CepUtils;

/**
 * O que a NOSSA API devolve na consulta de CEP.
 *
 * Traduz o formato do ViaCEP para o nosso: "localidade" vira "cidade", e os
 * nomes batem com os campos de Endereco, entao o frontend preenche o
 * formulario sem mapeamento manual. Se o ViaCEP mudar ou for trocado por outro
 * provedor, este contrato nao muda.
 */
public record CepResponse(
        String cep,
        String logradouro,
        String complemento,
        String bairro,
        String cidade,
        String uf) {

    public static CepResponse de(ViaCepResponse origem) {
        return new CepResponse(
                CepUtils.normalizar(origem.cep()),
                textoOuVazio(origem.logradouro()),
                textoOuVazio(origem.complemento()),
                textoOuVazio(origem.bairro()),
                textoOuVazio(origem.localidade()),
                textoOuVazio(origem.uf()));
    }

    /**
     * O ViaCEP devolve string vazia para campos que nao se aplicam: CEP de
     * faixa unica (cidade inteira) vem sem logradouro e sem bairro. Normalizar
     * para vazio evita nulo no JSON e deixa o formulario do frontend editavel.
     */
    private static String textoOuVazio(String valor) {
        return valor == null ? "" : valor.trim();
    }
}
