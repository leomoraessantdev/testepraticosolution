package com.solution.testepratico.usuario;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    /** Usado no login. O CPF chega sempre normalizado (so digitos). */
    Optional<Usuario> findByCpf(String cpf);

    boolean existsByCpf(String cpf);

    /**
     * IgnoreCase gera "lower(email) = lower(?)", que casa exatamente com o
     * indice funcional uk_usuarios_email.
     */
    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}
