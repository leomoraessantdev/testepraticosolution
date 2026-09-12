package com.solution.testepratico.seguranca;

import com.solution.testepratico.shared.exception.AcessoNegadoException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * PONTO UNICO DA REGRA DE ISOLAMENTO ENTRE USUARIOS.
 *
 * Todo acesso a dado que pertence a um usuario passa por exigirAcessoAoUsuario.
 * Concentrar a regra aqui significa que ela e auditavel: para saber se alguem
 * pode ler os dados de outro, basta ler este arquivo e procurar quem o chama.
 *
 * Se a verificacao estivesse espalhada pelos controllers, bastaria um endpoint
 * novo esquecer a linha para abrir um vazamento — e ninguem perceberia.
 */
@Component
public class ControleAcesso {

    /**
     * O usuario da requisicao atual, lido do SecurityContext que o
     * JwtAuthenticationFilter populou.
     *
     * O id vem do JWT ASSINADO, nunca de parametro da URL ou do corpo. Essa e a
     * diferenca que sustenta toda a regra: o cliente controla o que manda na
     * URL, mas nao consegue forjar o token sem o segredo do servidor.
     */
    public UsuarioAutenticado usuarioAtual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !(auth.getPrincipal() instanceof UsuarioAutenticado usuario)) {
            throw new AcessoNegadoException("Requisicao sem usuario autenticado.");
        }
        return usuario;
    }

    public Long idDoUsuarioAtual() {
        return usuarioAtual().id();
    }

    /**
     * A REGRA: ou voce e ADMIN, ou o recurso e seu.
     *
     * Chamada no inicio de toda operacao de leitura/escrita sobre dados de um
     * usuario. O idAlvo e o que veio na URL; o id de comparacao vem do token.
     */
    public void exigirAcessoAoUsuario(Long idAlvo) {
        UsuarioAutenticado atual = usuarioAtual();

        if (atual.isAdmin()) {
            return;
        }
        if (!atual.id().equals(idAlvo)) {
            throw new AcessoNegadoException(
                    "Voce nao tem permissao para acessar dados de outro usuario.");
        }
    }

    public void exigirAdmin() {
        if (!usuarioAtual().isAdmin()) {
            throw new AcessoNegadoException("Operacao restrita a administradores.");
        }
    }
}
