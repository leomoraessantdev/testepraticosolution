package com.solution.testepratico.seguranca;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Le o header Authorization, valida o JWT e popula o SecurityContext.
 *
 * Estende OncePerRequestFilter para garantir uma unica execucao por requisicao:
 * um filtro comum rodaria de novo em forwards internos (ex.: /error), o que
 * desperdicaria validacao e pode confundir o contexto.
 *
 * O filtro NUNCA rejeita a requisicao. Se nao ha token, ou ele e invalido, o
 * contexto simplesmente fica vazio e quem decide o desfecho e a camada de
 * autorizacao (401 pelo entry point, ou 200 se a rota for publica).
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String PREFIXO = "Bearer ";

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith(PREFIXO)) {
            String token = header.substring(PREFIXO.length());

            jwtService.extrairUsuario(token).ifPresent(usuario -> {
                var auth = new UsernamePasswordAuthenticationToken(
                        usuario, null, usuario.authorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            });
        }

        filterChain.doFilter(request, response);
    }
}
