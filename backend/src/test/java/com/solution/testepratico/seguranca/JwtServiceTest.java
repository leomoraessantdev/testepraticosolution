package com.solution.testepratico.seguranca;

import com.solution.testepratico.usuario.Role;
import com.solution.testepratico.usuario.Usuario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private static final String SEGREDO =
            "segredo-de-teste-com-mais-de-32-bytes-para-hs256-funcionar";

    private final JwtService jwtService = new JwtService(SEGREDO, 120);

    private Usuario usuario(Long id, String cpf, Role role) {
        var u = new Usuario("Fulano", cpf, LocalDate.of(1990, 1, 1), "hash", role);
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    @Test
    @DisplayName("token gerado carrega id, cpf e role")
    void idaEVolta() {
        String token = jwtService.gerarToken(usuario(7L, "52998224725", Role.USUARIO_COMUM));

        var extraido = jwtService.extrairUsuario(token);

        assertThat(extraido).isPresent();
        assertThat(extraido.get().id()).isEqualTo(7L);
        assertThat(extraido.get().cpf()).isEqualTo("52998224725");
        assertThat(extraido.get().role()).isEqualTo(Role.USUARIO_COMUM);
        assertThat(extraido.get().isAdmin()).isFalse();
    }

    @Test
    @DisplayName("token assinado com outro segredo e rejeitado")
    void segredoDiferente() {
        var outroServico = new JwtService(
                "OUTRO-segredo-completamente-diferente-com-32-bytes-ou-mais", 120);

        String tokenForjado = outroServico.gerarToken(usuario(1L, "52998224725", Role.ADMIN));

        assertThat(jwtService.extrairUsuario(tokenForjado)).isEmpty();
    }

    @Test
    @DisplayName("token adulterado no payload e rejeitado pela assinatura")
    void payloadAdulterado() {
        String token = jwtService.gerarToken(usuario(7L, "52998224725", Role.USUARIO_COMUM));

        String[] partes = token.split("[.]");
        // Troca o payload por um que se declara ADMIN, mantendo a assinatura.
        String payloadFalso = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(
                "{\"sub\":\"7\",\"cpf\":\"52998224725\",\"role\":\"ADMIN\"}"
                        .getBytes(java.nio.charset.StandardCharsets.UTF_8));
        String adulterado = partes[0] + "." + payloadFalso + "." + partes[2];

        assertThat(jwtService.extrairUsuario(adulterado)).isEmpty();
    }

    @Test
    @DisplayName("token expirado e rejeitado")
    void expirado() {
        var servicoExpirado = new JwtService(SEGREDO, -1);

        String token = servicoExpirado.gerarToken(usuario(7L, "52998224725", Role.USUARIO_COMUM));

        assertThat(servicoExpirado.extrairUsuario(token)).isEmpty();
    }

    @Test
    @DisplayName("lixo no lugar do token nao lanca excecao, apenas nao autentica")
    void tokenMalformado() {
        assertThat(jwtService.extrairUsuario("isso-nao-e-um-jwt")).isEmpty();
        assertThat(jwtService.extrairUsuario("")).isEmpty();
    }
}
