package com.solution.testepratico.seguranca;

import com.solution.testepratico.usuario.Role;
import com.solution.testepratico.usuario.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtService {

    private final SecretKey chave;
    private final Duration expiracao;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiracao-minutos}") long expiracaoMinutos) {
        // hmacShaKeyFor exige no minimo 256 bits (32 bytes) para HS256 e
        // lanca excecao no startup se o segredo for curto demais. Falhar no
        // boot e melhor que rodar com assinatura fraca.
        this.chave = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiracao = Duration.ofMinutes(expiracaoMinutos);
    }

    public String gerarToken(Usuario usuario) {
        Instant agora = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(usuario.getId()))
                .claim("cpf", usuario.getCpf())
                .claim("role", usuario.getRole().name())
                .issuedAt(Date.from(agora))
                .expiration(Date.from(agora.plus(expiracao)))
                .signWith(chave)
                .compact();
    }

    public long expiracaoEmSegundos() {
        return expiracao.toSeconds();
    }

    /**
     * Devolve o usuario do token, ou Optional.empty() se o token for invalido:
     * assinatura adulterada, expirado, malformado ou com claims fora do
     * esperado. Token invalido nunca vira excecao propagada — vira "nao
     * autenticado", que o entry point traduz em 401.
     *
     * parseSignedClaims valida a assinatura ANTES de entregar o conteudo, entao
     * um atacante nao consegue trocar "role":"USUARIO_COMUM" por "ADMIN" sem
     * conhecer o segredo.
     */
    public Optional<UsuarioAutenticado> extrairUsuario(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(chave)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            Long id = Long.valueOf(claims.getSubject());
            String cpf = claims.get("cpf", String.class);
            Role role = Role.valueOf(claims.get("role", String.class));

            return Optional.of(new UsuarioAutenticado(id, cpf, role));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
