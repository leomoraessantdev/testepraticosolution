package com.solution.testepratico.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.solution.testepratico.seguranca.JwtAuthenticationFilter;
import com.solution.testepratico.shared.exception.ApiError;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final ObjectMapper objectMapper;
    private final String origensPermitidas;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter,
                          ObjectMapper objectMapper,
                          @org.springframework.beans.factory.annotation.Value("${app.cors.origens}")
                          String origensPermitidas) {
        this.jwtFilter = jwtFilter;
        this.objectMapper = objectMapper;
        this.origensPermitidas = origensPermitidas;
    }

    /**
     * BCrypt com custo 10 (padrao). O custo e gravado dentro do proprio hash,
     * entao aumenta-lo depois nao invalida as senhas ja cadastradas.
     *
     * BCrypt gera salt aleatorio por senha: duas contas com a mesma senha
     * produzem hashes diferentes, o que inutiliza rainbow tables.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // API stateless com JWT nao usa cookie de sessao, e CSRF depende de
            // o navegador anexar credencial automaticamente. Sem cookie, nao ha
            // vetor de CSRF para proteger.
            .csrf(csrf -> csrf.disable())

            // STATELESS: o servidor nao cria nem consulta HttpSession. Cada
            // requisicao se autentica sozinha pelo token.
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // ---------- CAMADA 1 de autorizacao: por rota ----------
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers("/actuator/health").permitAll()

                // Cadastro publico. O DTO nao tem campo role, entao ninguem
                // se cadastra como ADMIN por aqui.
                .requestMatchers(HttpMethod.POST, "/api/usuarios").permitAll()

                // Listar todos os usuarios e operacao administrativa. Barrado
                // aqui, antes de chegar ao controller.
                .requestMatchers(HttpMethod.GET, "/api/usuarios").hasRole("ADMIN")

                // Listagem global de enderecos, fora do contexto de um usuario.
                .requestMatchers(HttpMethod.GET, "/api/enderecos").hasRole("ADMIN")

                // Fecha por padrao: rota nova nasce protegida. O inverso
                // (liberar tudo e proteger caso a caso) erra para o lado
                // perigoso quando alguem esquece.
                .anyRequest().authenticated())

            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) ->
                    escrever(res, HttpServletResponse.SC_UNAUTHORIZED, "Nao autorizado",
                             "Token ausente ou invalido.", req.getRequestURI()))
                .accessDeniedHandler((req, res, e) ->
                    escrever(res, HttpServletResponse.SC_FORBIDDEN, "Acesso negado",
                             "Voce nao tem permissao para este recurso.", req.getRequestURI())))

            // Antes do filtro de login por formulario: quando a requisicao
            // chegar na etapa de autorizacao, o contexto ja esta preenchido.
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private void escrever(HttpServletResponse res, int status, String erro,
                          String mensagem, String caminho) throws java.io.IOException {
        res.setStatus(status);
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(res.getWriter(), ApiError.de(status, erro, mensagem, caminho));
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Origens explicitas, nunca "*": o frontend precisa mandar o header
        // Authorization, e o navegador recusa credencial com origem curinga.
        config.setAllowedOrigins(List.of(origensPermitidas.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
