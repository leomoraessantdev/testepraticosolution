package com.solution.testepratico.usuario;

/**
 * Perfis de acesso.
 *
 * Persistido como texto (ver Usuario.role), nunca como ordinal: gravar a
 * posicao do enum faria qualquer reordenacao futura desta lista trocar o
 * perfil de usuarios ja cadastrados.
 */
public enum Role {

    ADMIN,
    USUARIO_COMUM;

    /**
     * Nome da authority no Spring Security. O prefixo "ROLE_" e a convencao
     * exigida por hasRole(...) e por @PreAuthorize("hasRole('ADMIN')").
     */
    public String authority() {
        return "ROLE_" + name();
    }
}
