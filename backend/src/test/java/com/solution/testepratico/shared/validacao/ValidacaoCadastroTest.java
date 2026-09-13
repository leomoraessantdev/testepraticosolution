package com.solution.testepratico.shared.validacao;

import com.solution.testepratico.usuario.dto.CriarUsuarioRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Bean Validation sem subir contexto Spring: valida as regras do cadastro
 * direto no DTO, que e onde elas moram.
 */
class ValidacaoCadastroTest {

    private final Validator validator;

    ValidacaoCadastroTest() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            this.validator = factory.getValidator();
        }
    }

    private CriarUsuarioRequest pedido(String cpf, LocalDate nascimento) {
        return new CriarUsuarioRequest("Fulano de Tal", cpf, nascimento, "senhaSegura123");
    }

    private Set<String> camposComErro(CriarUsuarioRequest pedido) {
        return validator.validate(pedido).stream()
                .map(v -> v.getPropertyPath().toString())
                .collect(Collectors.toSet());
    }

    @Test
    @DisplayName("cadastro valido nao produz erro")
    void cadastroValido() {
        assertThat(camposComErro(pedido("52998224725", LocalDate.of(1990, 5, 20)))).isEmpty();
    }

    // ---------- CPF ----------

    @Test
    @DisplayName("CPF com digito verificador errado e rejeitado")
    void cpfInvalido() {
        assertThat(camposComErro(pedido("52998224724", LocalDate.of(1990, 5, 20)))).contains("cpf");
    }

    @Test
    @DisplayName("CPF de sequencia repetida e rejeitado mesmo passando em regex")
    void cpfSequenciaRepetida() {
        assertThat(camposComErro(pedido("11111111111", LocalDate.of(1990, 5, 20)))).contains("cpf");
    }

    @Test
    @DisplayName("CPF com mascara e aceito: o service normaliza depois")
    void cpfComMascara() {
        assertThat(camposComErro(pedido("529.982.247-25", LocalDate.of(1990, 5, 20)))).isEmpty();
    }

    @Test
    @DisplayName("CPF em branco produz uma mensagem, nao duas")
    void cpfEmBranco() {
        var erros = validator.validate(pedido("", LocalDate.of(1990, 5, 20)));
        assertThat(erros).hasSize(1);
        assertThat(erros.iterator().next().getMessage()).contains("obrigatorio");
    }

    // ---------- Data de nascimento ----------

    @Test
    @DisplayName("data de nascimento e obrigatoria")
    void dataNascimentoObrigatoria() {
        assertThat(camposComErro(pedido("52998224725", null))).contains("dataNascimento");
    }

    @Test
    @DisplayName("data de nascimento no futuro e rejeitada")
    void dataNascimentoFutura() {
        assertThat(camposComErro(pedido("52998224725", LocalDate.now().plusDays(1))))
                .contains("dataNascimento");
        assertThat(camposComErro(pedido("52998224725", LocalDate.now().plusYears(10))))
                .contains("dataNascimento");
    }

    @Test
    @DisplayName("data de nascimento de hoje e aceita")
    void dataNascimentoHoje() {
        assertThat(camposComErro(pedido("52998224725", LocalDate.now()))).isEmpty();
    }

    // ---------- Demais campos ----------

    @Test
    @DisplayName("senha curta demais e rejeitada")
    void senhaCurta() {
        var pedido = new CriarUsuarioRequest("Fulano", "52998224725",
                LocalDate.of(1990, 5, 20), "1234");
        assertThat(camposComErro(pedido)).contains("senha");
    }

    @Test
    @DisplayName("o DTO de cadastro nao tem campo role: nao ha como se autopromover")
    void semCampoRole() {
        boolean temRole = java.util.Arrays.stream(CriarUsuarioRequest.class.getRecordComponents())
                .anyMatch(c -> c.getName().toLowerCase().contains("role")
                            || c.getName().toLowerCase().contains("perfil"));
        assertThat(temRole).isFalse();
    }
}
