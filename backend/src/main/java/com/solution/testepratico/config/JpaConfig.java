package com.solution.testepratico.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Liga o suporte de auditoria do Spring Data JPA.
 * Sem esta anotacao os campos @CreatedDate / @LastModifiedDate
 * das entidades ficariam sempre nulos.
 */
@Configuration
@EnableJpaAuditing
public class JpaConfig {
}
