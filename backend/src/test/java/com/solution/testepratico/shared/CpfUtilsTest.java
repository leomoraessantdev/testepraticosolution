package com.solution.testepratico.shared;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class CpfUtilsTest {

    @Test
    @DisplayName("normalizar remove mascara e mantem apenas digitos")
    void normalizaMascara() {
        assertThat(CpfUtils.normalizar("529.982.247-25")).isEqualTo("52998224725");
        assertThat(CpfUtils.normalizar("52998224725")).isEqualTo("52998224725");
        assertThat(CpfUtils.normalizar(null)).isNull();
    }

    @ParameterizedTest
    @ValueSource(strings = {"52998224725", "11144477735", "39053344705", "529.982.247-25"})
    @DisplayName("aceita CPF com digitos verificadores corretos")
    void aceitaValidos(String cpf) {
        assertThat(CpfUtils.valido(cpf)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "52998224724",   // ultimo digito trocado
            "12345678901",   // digitos verificadores errados
            "1234567890",    // curto demais
            "123456789012",  // longo demais
            "00000000000",   // sequencia repetida
            "11111111111",
            ""
    })
    @DisplayName("rejeita CPF invalido")
    void rejeitaInvalidos(String cpf) {
        assertThat(CpfUtils.valido(cpf)).isFalse();
    }

    @Test
    @DisplayName("rejeita nulo sem lancar excecao")
    void rejeitaNulo() {
        assertThat(CpfUtils.valido(null)).isFalse();
    }
}
