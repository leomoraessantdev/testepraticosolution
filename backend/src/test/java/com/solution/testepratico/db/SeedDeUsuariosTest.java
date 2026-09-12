package com.solution.testepratico.db;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Trava os hashes da migration V3__seed_usuarios.sql.
 *
 * Os hashes foram gerados fora do projeto; sem este teste, ninguem saberia se
 * eles realmente conferem com as senhas documentadas no proprio arquivo SQL.
 * Se alguem trocar um hash ou uma senha do seed, este teste quebra.
 */
class SeedDeUsuariosTest {

    private static final String HASH_ADMIN =
            "$2b$10$0zUn26pyOoigm9roURyfYecNyh/zPkpqxg9CypmvOX/vbtZ/vyG9K";
    private static final String HASH_USUARIO_COMUM =
            "$2b$10$L/4LH62jpdD9INDm4asuTeG10.oSt9eG35qWwjhBYgXKUD3K5DYxm";

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Test
    @DisplayName("hash do admin confere com a senha documentada no seed")
    void hashAdminConfere() {
        assertThat(encoder.matches("admin123", HASH_ADMIN)).isTrue();
        assertThat(encoder.matches("senha-errada", HASH_ADMIN)).isFalse();
    }

    @Test
    @DisplayName("hash dos usuarios comuns confere com a senha documentada no seed")
    void hashUsuarioComumConfere() {
        assertThat(encoder.matches("usuario123", HASH_USUARIO_COMUM)).isTrue();
        assertThat(encoder.matches("admin123", HASH_USUARIO_COMUM)).isFalse();
    }

    @Test
    @DisplayName("hash cabe na coluna senha_hash VARCHAR(72)")
    void hashCabeNaColuna() {
        assertThat(HASH_ADMIN).hasSize(60);
        assertThat(HASH_USUARIO_COMUM).hasSize(60);
    }

    @Test
    @DisplayName("BCrypt gera salt diferente por senha: mesma senha, hashes distintos")
    void saltAleatorio() {
        String a = encoder.encode("mesmaSenha");
        String b = encoder.encode("mesmaSenha");

        assertThat(a).isNotEqualTo(b);
        assertThat(encoder.matches("mesmaSenha", a)).isTrue();
        assertThat(encoder.matches("mesmaSenha", b)).isTrue();
    }
}
