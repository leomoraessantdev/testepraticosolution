import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { somenteDigitos } from '@/lib/validacao'
import { chaves } from './chaves'

/** Resposta do nosso backend, ja normalizada a partir do ViaCEP. */
export type CepResponse = {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
}

/**
 * Consulta de CEP imperativa, para rodar no blur do campo.
 *
 * Nao e useQuery porque o gatilho e um evento, nao a renderizacao: o CEP so
 * deve ser buscado quando a pessoa termina de digitar.
 *
 * fetchQuery em vez de api.get direto, e aqui esta o ponto: a resposta entra no
 * cache do React Query com staleTime infinito, entao sair e voltar no mesmo
 * campo, ou cadastrar dois enderecos com o mesmo CEP, nao gera nova requisicao
 * nem para o nosso backend.
 *
 * Ou seja, o requisito "evitar consultas repetidas desnecessarias" fica
 * atendido em duas camadas: este cache poupa a chamada ao nosso servidor, e o
 * @Cacheable do CepService poupa a chamada ao ViaCEP.
 */
export function useConsultarCep() {
  const queryClient = useQueryClient()

  return (cepComOuSemMascara: string) => {
    const cep = somenteDigitos(cepComOuSemMascara)

    return queryClient.fetchQuery({
      queryKey: chaves.cep(cep),
      queryFn: async () => {
        const { data } = await api.get<CepResponse>(`/api/cep/${cep}`)
        return data
      },
      // CEP nao muda enquanto a aba esta aberta. O TTL de verdade e o do
      // backend (24h, configuravel); aqui basta nao repetir na sessao.
      staleTime: Infinity,
    })
  }
}
