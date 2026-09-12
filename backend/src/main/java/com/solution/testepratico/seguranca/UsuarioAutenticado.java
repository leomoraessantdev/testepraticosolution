package com.solution.testepratico.seguranca;

import com.solution.testepratico.usuario.Role;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collection;
import java.util.List;

/**
 * Quem esta fazendo a requisicao. Fica dentro do SecurityContext e e montado
 * a partir do JWT a cada request.
 *
 * Carrega o ID justamente porque a regra de isolamento entre usuarios precisa
 * comparar "id de quem pede" com "id de quem e dono". O UserDetails padrao do
 * Spring Security so tem username, o que obrigaria uma consulta extra ao banco
 * em toda verificacao de dono.
 */
public record UsuarioAutenticado(Long id, String cpf, Role role) {

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }

    public Collection<GrantedAuthority> authorities() {
        return List.of(new SimpleGrantedAuthority(role.authority()));
    }
}
