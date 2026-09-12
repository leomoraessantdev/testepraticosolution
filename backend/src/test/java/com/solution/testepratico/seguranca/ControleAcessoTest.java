package com.solution.testepratico.seguranca;

import com.solution.testepratico.shared.exception.AcessoNegadoException;
import com.solution.testepratico.usuario.Role;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * O REQUISITO CRITICO, testado isoladamente.
 *
 * Nao sobe contexto Spring nem banco: a regra e uma comparacao pura, e teste
 * de regra deve falhar por causa da regra, nunca por infraestrutura.
 */
class ControleAcessoTest {

    private static final Long ANA = 10L;
    private static final Long BRUNO = 20L;

    private final ControleAcesso controleAcesso = new ControleAcesso();

    @AfterEach
    void limparContexto() {
        // O SecurityContextHolder usa ThreadLocal. Sem limpar, a autenticacao
        // de um teste vazaria para o proximo executado na mesma thread.
        SecurityContextHolder.clearContext();
    }

    private void autenticarComo(Long id, Role role) {
        var usuario = new UsuarioAutenticado(id, "00000000000", role);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(usuario, null, usuario.authorities()));
    }

    @Test
    @DisplayName("usuario comum acessa os proprios dados")
    void usuarioComumAcessaOsProprios() {
        autenticarComo(ANA, Role.USUARIO_COMUM);

        assertThatCode(() -> controleAcesso.exigirAcessoAoUsuario(ANA))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("REQUISITO CRITICO: usuario comum NAO acessa dados de outro usuario")
    void usuarioComumNaoAcessaDeOutro() {
        autenticarComo(ANA, Role.USUARIO_COMUM);

        assertThatThrownBy(() -> controleAcesso.exigirAcessoAoUsuario(BRUNO))
                .isInstanceOf(AcessoNegadoException.class)
                .hasMessageContaining("outro usuario");
    }

    @Test
    @DisplayName("admin acessa dados de qualquer usuario")
    void adminAcessaQualquer() {
        autenticarComo(1L, Role.ADMIN);

        assertThatCode(() -> controleAcesso.exigirAcessoAoUsuario(ANA))
                .doesNotThrowAnyException();
        assertThatCode(() -> controleAcesso.exigirAcessoAoUsuario(BRUNO))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("usuario comum nao executa operacao de admin")
    void usuarioComumNaoEhAdmin() {
        autenticarComo(ANA, Role.USUARIO_COMUM);

        assertThatThrownBy(controleAcesso::exigirAdmin)
                .isInstanceOf(AcessoNegadoException.class);
    }

    @Test
    @DisplayName("contexto sem autenticacao e tratado como acesso negado")
    void semAutenticacao() {
        SecurityContextHolder.clearContext();

        assertThatThrownBy(() -> controleAcesso.exigirAcessoAoUsuario(ANA))
                .isInstanceOf(AcessoNegadoException.class);
    }

    @Test
    @DisplayName("id do usuario atual vem do contexto, nunca de parametro")
    void idVemDoContexto() {
        autenticarComo(ANA, Role.USUARIO_COMUM);

        assertThat(controleAcesso.idDoUsuarioAtual()).isEqualTo(ANA);
    }
}
