import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { somenteDigitos } from '@/lib/validacao'
import type { EnderecoResponse, PaginaResponse } from '@/tipos'
import { chaves } from './chaves'

export type CorpoEndereco = {
  cep: string
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  uf: string
  principal?: boolean
}

/** Endereco do admin: inclui o dono, porque a listagem global cruza usuarios. */
export type EnderecoAdmin = EnderecoResponse & {
  usuarioId: number
  usuarioNome: string
}

function semMascara(corpo: CorpoEndereco): CorpoEndereco {
  return { ...corpo, cep: somenteDigitos(corpo.cep) }
}

/** Listagem global paginada. Restrita a ADMIN no backend. */
export function useEnderecosGlobais(pagina: number, tamanho = 20) {
  return useQuery({
    queryKey: chaves.enderecosGlobais(pagina),
    queryFn: async () => {
      const { data } = await api.get<PaginaResponse<EnderecoAdmin>>('/api/enderecos', {
        params: { page: pagina, size: tamanho },
      })
      return data
    },
    // Mantem a pagina anterior na tela enquanto a nova carrega, em vez de
    // piscar a tabela vazia a cada clique em "proxima".
    placeholderData: (anterior) => anterior,
  })
}

/**
 * Invalida tudo que uma escrita de endereco pode ter mudado.
 *
 * Sempre as tres chaves, e nao so a lista do usuario: as regras do endereco
 * principal alteram OUTRAS linhas alem da que foi tocada - definir um principal
 * rebaixa o anterior, e excluir o principal promove um sucessor. Invalidar
 * apenas o registro editado deixaria a tela mostrando dois principais.
 */
function useInvalidarEnderecos(usuarioId: number) {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: chaves.enderecos(usuarioId) })
    queryClient.invalidateQueries({ queryKey: chaves.usuario(usuarioId) })
    queryClient.invalidateQueries({ queryKey: ['enderecos-globais'] })
  }
}

export function useCriarEndereco(usuarioId: number) {
  const invalidar = useInvalidarEnderecos(usuarioId)

  return useMutation({
    mutationFn: async (corpo: CorpoEndereco) => {
      const { data } = await api.post<EnderecoResponse>(
        `/api/usuarios/${usuarioId}/enderecos`,
        semMascara(corpo),
      )
      return data
    },
    onSuccess: invalidar,
  })
}

export function useAtualizarEndereco(usuarioId: number) {
  const invalidar = useInvalidarEnderecos(usuarioId)

  return useMutation({
    mutationFn: async ({ id, corpo }: { id: number; corpo: CorpoEndereco }) => {
      // O PUT do backend nao aceita "principal": trocar o principal e outra
      // operacao, com regra propria. Remove o campo para nao sugerir que o
      // formulario de edicao altera isso.
      const { principal: _ignorado, ...semPrincipal } = semMascara(corpo)
      const { data } = await api.put<EnderecoResponse>(
        `/api/usuarios/${usuarioId}/enderecos/${id}`,
        semPrincipal,
      )
      return data
    },
    onSuccess: invalidar,
  })
}

export function useDefinirPrincipal(usuarioId: number) {
  const invalidar = useInvalidarEnderecos(usuarioId)

  return useMutation({
    mutationFn: async (enderecoId: number) => {
      const { data } = await api.patch<EnderecoResponse>(
        `/api/usuarios/${usuarioId}/enderecos/${enderecoId}/principal`,
      )
      return data
    },
    onSuccess: invalidar,
  })
}

export function useExcluirEndereco(usuarioId: number) {
  const invalidar = useInvalidarEnderecos(usuarioId)

  return useMutation({
    mutationFn: async (enderecoId: number) => {
      await api.delete(`/api/usuarios/${usuarioId}/enderecos/${enderecoId}`)
    },
    onSuccess: invalidar,
  })
}
