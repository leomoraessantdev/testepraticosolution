package com.solution.testepratico.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Cache em memoria com Caffeine.
 *
 * Caffeine e nao Redis: o dado cacheado e publico, pequeno e reconstruivel com
 * uma requisicao HTTP. Subir um servico externo so para isso adicionaria um
 * ponto de falha e um container ao docker compose sem resolver problema que
 * exista aqui. Em varias instancias, cada uma manteria seu proprio cache, o que
 * continua correto porque CEP nao e dado de sessao.
 *
 * expireAfterWrite e nao expireAfterAccess: um CEP muito consultado nao deve
 * ficar cacheado para sempre. Logradouro muda raramente, mas muda.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_CEPS = "ceps";

    @Bean
    public CacheManager cacheManager(
            @Value("${app.cache.ceps.ttl-horas}") long ttlHoras,
            @Value("${app.cache.ceps.tamanho-maximo}") long tamanhoMaximo) {

        var cacheManager = new CaffeineCacheManager(CACHE_CEPS);
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofHours(ttlHoras))
                // Limite de entradas: sem ele o cache cresceria sem teto e
                // viraria vazamento de memoria disfarcado.
                .maximumSize(tamanhoMaximo)
                .recordStats());

        return cacheManager;
    }
}
