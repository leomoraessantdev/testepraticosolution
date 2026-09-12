package com.solution.testepratico.viacep;

import com.solution.testepratico.config.CacheConfig;
import com.solution.testepratico.shared.exception.CepNaoEncontradoException;
import com.solution.testepratico.shared.exception.RegraDeNegocioException;
import com.solution.testepratico.shared.exception.ServicoExternoIndisponivelException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

/**
 * O cache exigido pelo documento, provado contando chamadas reais ao ViaCEP.
 *
 * O ViaCepClient e substituido por um mock: assim o teste nao depende da
 * internet nem castiga um servico publico gratuito a cada execucao.
 */
@SpringBootTest
class CepServiceIT {

    private static final String CEP = "01310100";

    @Autowired
    private CepService cepService;

    @Autowired
    private CacheManager cacheManager;

    @MockitoBean
    private ViaCepClient viaCepClient;

    private ViaCepResponse respostaValida() {
        return new ViaCepResponse("01310-100", "Avenida Paulista", null,
                "Bela Vista", "Sao Paulo", "SP", null);
    }

    @BeforeEach
    void limparCache() {
        // Cache e estado compartilhado entre testes. Sem limpar, o segundo
        // teste herdaria as entradas do primeiro e passaria por engano.
        var cache = cacheManager.getCache(CacheConfig.CACHE_CEPS);
        if (cache != null) {
            cache.clear();
        }
    }

    @Test
    @DisplayName("CACHE: consultas repetidas do mesmo CEP batem no ViaCEP uma unica vez")
    void consultaRepetidaUsaCache() {
        given(viaCepClient.buscar(CEP)).willReturn(respostaValida());

        CepResponse primeira = cepService.consultar(CEP);
        CepResponse segunda = cepService.consultar(CEP);
        CepResponse terceira = cepService.consultar(CEP);

        assertThat(primeira).isEqualTo(segunda).isEqualTo(terceira);
        verify(viaCepClient, times(1)).buscar(CEP);
    }

    @Test
    @DisplayName("CACHE: mesma consulta com e sem mascara usa a mesma entrada")
    void mascaraNaoDuplicaEntradaNoCache() {
        given(viaCepClient.buscar(CEP)).willReturn(respostaValida());

        cepService.consultar("01310-100");
        cepService.consultar("01310100");
        cepService.consultar("01.310-100");

        // A chave e o CEP normalizado. Fosse a string crua, seriam 3 chamadas.
        verify(viaCepClient, times(1)).buscar(CEP);
    }

    @Test
    @DisplayName("CACHE: CEPs diferentes nao compartilham entrada")
    void cepsDiferentesNaoColidem() {
        given(viaCepClient.buscar(anyString())).willReturn(respostaValida());

        cepService.consultar("01310100");
        cepService.consultar("04538133");

        verify(viaCepClient, times(1)).buscar("01310100");
        verify(viaCepClient, times(1)).buscar("04538133");
    }

    @Test
    @DisplayName("CACHE: falha NAO e cacheada, a proxima consulta tenta de novo")
    void falhaNaoEnvenenaOCache() {
        willThrow(new ServicoExternoIndisponivelException("ViaCEP", new RuntimeException("timeout")))
                .given(viaCepClient).buscar(CEP);

        assertThatThrownBy(() -> cepService.consultar(CEP))
                .isInstanceOf(ServicoExternoIndisponivelException.class);
        assertThatThrownBy(() -> cepService.consultar(CEP))
                .isInstanceOf(ServicoExternoIndisponivelException.class);

        // Se a falha fosse cacheada, um ViaCEP fora do ar por um minuto
        // deixaria o CEP inacessivel pelas proximas 24 horas.
        verify(viaCepClient, times(2)).buscar(CEP);
    }

    @Test
    @DisplayName("CEP inexistente vira CepNaoEncontradoException e nao e cacheado")
    void cepInexistente() {
        willThrow(new CepNaoEncontradoException(CEP)).given(viaCepClient).buscar(CEP);

        assertThatThrownBy(() -> cepService.consultar(CEP))
                .isInstanceOf(CepNaoEncontradoException.class)
                .hasMessageContaining(CEP);

        assertThatThrownBy(() -> cepService.consultar(CEP))
                .isInstanceOf(CepNaoEncontradoException.class);
        verify(viaCepClient, times(2)).buscar(CEP);
    }

    @Test
    @DisplayName("formato invalido falha ANTES de gastar chamada externa")
    void formatoInvalidoNaoChamaViaCep() {
        assertThatThrownBy(() -> cepService.consultar("abc"))
                .isInstanceOf(RegraDeNegocioException.class);
        assertThatThrownBy(() -> cepService.consultar("123"))
                .isInstanceOf(RegraDeNegocioException.class);
        assertThatThrownBy(() -> cepService.consultar(null))
                .isInstanceOf(RegraDeNegocioException.class);

        verify(viaCepClient, never()).buscar(anyString());
    }
}
