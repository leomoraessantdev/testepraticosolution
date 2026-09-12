package com.solution.testepratico.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class RestClientConfig {

    /**
     * RestClient dedicado ao ViaCEP.
     *
     * Os timeouts sao o ponto principal. Sem eles o padrao e esperar
     * indefinidamente: se o ViaCEP travar sem responder, cada requisicao nossa
     * prende uma thread do Tomcat ate esgotar o pool, e a aplicacao inteira
     * para por causa de uma dependencia de preenchimento de formulario.
     *
     * RestClient e nao RestTemplate: e a API sincrona atual do Spring, e o
     * RestTemplate esta em modo de manutencao.
     */
    @Bean
    public RestClient viaCepRestClient(
            @Value("${app.viacep.url}") String url,
            @Value("${app.viacep.timeout-conexao-ms}") long timeoutConexao,
            @Value("${app.viacep.timeout-leitura-ms}") long timeoutLeitura) {

        var fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(Duration.ofMillis(timeoutConexao));
        fabrica.setReadTimeout(Duration.ofMillis(timeoutLeitura));

        return RestClient.builder()
                .baseUrl(url)
                .requestFactory(fabrica)
                .build();
    }
}
