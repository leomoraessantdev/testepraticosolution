package com.solution.testepratico.viacep;

import com.solution.testepratico.config.CacheConfig;
import com.solution.testepratico.shared.CepUtils;
import com.solution.testepratico.shared.exception.RegraDeNegocioException;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class CepService {

    private final ViaCepClient viaCepClient;

    public CepService(ViaCepClient viaCepClient) {
        this.viaCepClient = viaCepClient;
    }

    /**
     * Consulta de CEP com cache.
     *
     * A anotacao fica NESTE metodo, o unico publico, e nao num metodo interno
     * chamado por ele. @Cacheable funciona por proxy: uma chamada de um metodo
     * da classe para outro da mesma classe nao passa pelo proxy, e o cache
     * simplesmente nao acontece. Foi exatamente o que aconteceu na primeira
     * versao deste arquivo, e o teste que conta chamadas ao ViaCEP pegou.
     *
     * A chave e o CEP normalizado, calculado em SpEL com o mesmo utilitario que
     * o metodo usa. Isso faz "01310-100" e "01310100" caírem na mesma entrada;
     * com a string crua como chave, a mesma consulta com e sem mascara guardaria
     * duas entradas e erraria o cache metade das vezes.
     *
     * So o sucesso e cacheado: @Cacheable nao armazena resultado quando o metodo
     * lanca excecao. E o comportamento desejado — um ViaCEP fora do ar por um
     * minuto nao pode deixar o CEP inacessivel pelas proximas 24 horas.
     */
    @Cacheable(
            cacheNames = CacheConfig.CACHE_CEPS,
            key = "T(com.solution.testepratico.shared.CepUtils).normalizar(#cepComOuSemMascara)",
            // Entrada nula produziria chave nula, e o Spring rejeita isso antes
            // de executar o metodo: o cliente receberia um erro interno em vez
            // da mensagem de validacao. Com a condicao, o metodo roda e lanca a
            // excecao de regra de negocio normalmente.
            condition = "#cepComOuSemMascara != null")
    public CepResponse consultar(String cepComOuSemMascara) {
        String cep = normalizarEValidar(cepComOuSemMascara);
        return CepResponse.de(viaCepClient.buscar(cep));
    }

    /**
     * O formato e validado antes da chamada externa: nao faz sentido gastar uma
     * requisicao HTTP para descobrir que "abc" nao e CEP.
     */
    private String normalizarEValidar(String cepComOuSemMascara) {
        String cep = CepUtils.normalizar(cepComOuSemMascara);

        if (cep == null || !cep.matches("[0-9]{8}")) {
            throw new RegraDeNegocioException("CEP deve conter 8 digitos.");
        }
        return cep;
    }
}
