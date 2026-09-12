package com.solution.testepratico.viacep;

import com.solution.testepratico.shared.exception.CepNaoEncontradoException;
import com.solution.testepratico.shared.exception.ServicoExternoIndisponivelException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Fala HTTP com o ViaCEP. Sem cache aqui de proposito: o cache mora no
 * CepService, uma camada acima, para esta classe continuar sendo a unica coisa
 * que precisa ser substituida num teste quando se quer contar chamadas reais.
 */
@Component
public class ViaCepClient {

    private static final Logger log = LoggerFactory.getLogger(ViaCepClient.class);

    private final RestClient restClient;

    public ViaCepClient(RestClient viaCepRestClient) {
        this.restClient = viaCepRestClient;
    }

    /**
     * Consulta o CEP. O parametro chega normalizado (8 digitos).
     *
     * Todo modo de falha vira uma excecao nossa. O service que chama nao
     * precisa saber que existe HTTP do outro lado.
     */
    public ViaCepResponse buscar(String cep) {
        try {
            ViaCepResponse resposta = restClient.get()
                    .uri("/{cep}/json/", cep)
                    .retrieve()
                    .body(ViaCepResponse.class);

            if (resposta == null || resposta.naoEncontrado()) {
                throw new CepNaoEncontradoException(cep);
            }
            return resposta;

        } catch (CepNaoEncontradoException e) {
            // Nao e falha de integracao: e resposta valida dizendo que o CEP
            // nao existe. Repassa sem virar 503.
            throw e;

        } catch (RestClientException e) {
            // Cobre timeout, DNS fora, conexao recusada e status 4xx/5xx do
            // ViaCEP. Tudo isso e indisponibilidade do ponto de vista do cliente.
            log.warn("Falha ao consultar ViaCEP para o CEP {}: {}", cep, e.getMessage());
            throw new ServicoExternoIndisponivelException("ViaCEP", e);
        }
    }
}
