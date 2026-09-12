/** Tipos que espelham os DTOs de resposta da API. */

export type Role = 'ADMIN' | 'USUARIO_COMUM'

/** POST /api/auth/login */
export type LoginResponse = {
  token: string
  tipo: string
  expiraEmSegundos: number
  usuarioId: number
  nome: string
  role: Role
}

/** Resumo de usuario: GET /api/usuarios e POST /api/usuarios */
export type UsuarioResponse = {
  id: number
  nome: string
  cpf: string
  email: string
  dataNascimento: string
  role: Role
  ativo: boolean
  criadoEm: string
}

/** GET /api/usuarios/{id}/enderecos */
export type EnderecoResponse = {
  id: number
  cep: string
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  uf: string
  principal: boolean
}

/** GET /api/usuarios/{id} e /api/usuarios/me */
export type UsuarioDetalheResponse = UsuarioResponse & {
  enderecos: EnderecoResponse[]
}

/** Envelope de paginacao do backend (PaginaResponse). */
export type PaginaResponse<T> = {
  conteudo: T[]
  pagina: number
  tamanho: number
  totalElementos: number
  totalPaginas: number
  ultima: boolean
}
