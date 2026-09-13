import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { somenteDigitos } from '@/lib/validacao'
import type { UsuarioDetalheResponse, UsuarioResponse } from '@/tipos'
import { chaves } from './chaves'

/** Corpo do cadastro. O CPF vai sem mascara; data em ISO aaaa-mm-dd. */
export type NovoUsuario = {
  nome: string
  cpf: string
  dataNascimento: string
  senha: string
}

/** Listagem completa. Restrita a ADMIN no backend (SecurityConfig). */
export function useUsuarios() {
  return useQuery({
    queryKey: chaves.usuarios,
    queryFn: async () => {
      const { data } = await api.get<UsuarioResponse[]>('/api/usuarios')
      return data
    },
  })
}

/** Dados do usuario com os enderecos. Serve o admin e o proprio usuario. */
export function useUsuario(id: number | undefined) {
  return useQuery({
    queryKey: chaves.usuario(id ?? 0),
    // Nao dispara sem id: um GET /api/usuarios/undefined viraria 400.
    enabled: id !== undefined,
    queryFn: async () => {
      const { data } = await api.get<UsuarioDetalheResponse>(`/api/usuarios/${id}`)
      return data
    },
  })
}

export function useCriarUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (novo: NovoUsuario) => {
      const { data } = await api.post<UsuarioResponse>('/api/usuarios', {
        ...novo,
        cpf: somenteDigitos(novo.cpf),
      })
      return data
    },
    // A listagem do admin passa a conter o novo usuario. Invalida em vez de
    // inserir na mao: o servidor e a fonte da verdade, e o registro volta com
    // id e criadoEm que o cliente nao tem como adivinhar.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chaves.usuarios }),
  })
}
