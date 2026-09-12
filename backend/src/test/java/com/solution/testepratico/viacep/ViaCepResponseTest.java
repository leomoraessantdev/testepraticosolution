package com.solution.testepratico.viacep;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * A armadilha do ViaCEP: CEP inexistente devolve HTTP 200, nao 404.
 * Quem checar so o status code grava um endereco vazio achando que deu certo.
 */
class ViaCepResponseTest {

    @Test
    @DisplayName("resposta com erro=true e tratada como nao encontrado")
    void erroVerdadeiro() {
        var resposta = new ViaCepResponse(null, null, null, null, null, null, true);
        assertThat(resposta.naoEncontrado()).isTrue();
    }

    @Test
    @DisplayName("resposta sem cep e tratada como nao encontrado, mesmo sem o campo erro")
    void semCep() {
        var resposta = new ViaCepResponse(null, "Rua X", null, "Centro", "Sao Paulo", "SP", null);
        assertThat(resposta.naoEncontrado()).isTrue();

        var cepVazio = new ViaCepResponse("  ", "Rua X", null, "Centro", "Sao Paulo", "SP", null);
        assertThat(cepVazio.naoEncontrado()).isTrue();
    }

    @Test
    @DisplayName("resposta valida nao e tratada como erro")
    void respostaValida() {
        var resposta = new ViaCepResponse("01310-100", "Avenida Paulista", "de 1-10",
                "Bela Vista", "Sao Paulo", "SP", null);
        assertThat(resposta.naoEncontrado()).isFalse();
    }

    @Test
    @DisplayName("CepResponse traduz localidade para cidade e normaliza o CEP")
    void traducaoParaNossoFormato() {
        var origem = new ViaCepResponse("01310-100", "Avenida Paulista", null,
                "Bela Vista", "Sao Paulo", "SP", null);

        CepResponse nosso = CepResponse.de(origem);

        assertThat(nosso.cep()).isEqualTo("01310100");
        assertThat(nosso.cidade()).isEqualTo("Sao Paulo");
        assertThat(nosso.complemento()).as("nulo do ViaCEP vira vazio").isEmpty();
    }
}
