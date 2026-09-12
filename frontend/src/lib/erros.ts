import { AxiosError } from 'axios'

/**
 * O formato unico de erro da API, espelhando o record ApiError do backend.
 * Como todo erro sai pelo GlobalExceptionHandler, o frontend trata um shape so.
 */
export type ApiError = {
  timestamp: string
  status: number
  erro: string
  mensagem: string
  caminho: string
  campos?: { campo: string; mensagem: string }[]
}

function corpoDeErro(e: unknown): ApiError | undefined {
  if (e instanceof AxiosError && e.response?.data && typeof e.response.data === 'object') {
    return e.response.data as ApiError
  }
  return undefined
}

export function statusDoErro(e: unknown): number | undefined {
  return e instanceof AxiosError ? e.response?.status : undefined
}

/**
 * Mensagem pronta para exibir.
 *
 * A ordem importa: primeiro a mensagem que o backend escreveu (e a mais
 * especifica), depois um texto por familia de status, e so no fim um genérico.
 * Nunca mostra "AxiosError: Request failed with status code 409" ao usuario.
 */
export function mensagemDeErro(e: unknown): string {
  const corpo = corpoDeErro(e)
  if (corpo?.mensagem) return corpo.mensagem

  // Requisicao que nem chegou: backend desligado, DNS, CORS barrado.
  if (e instanceof AxiosError && !e.response) {
    return 'Nao foi possivel falar com o servidor. Verifique se a API esta no ar.'
  }

  const status = statusDoErro(e)
  if (status === 401) return 'Sessao expirada. Entre novamente.'
  if (status === 403) return 'Voce nao tem permissao para esta acao.'
  if (status === 404) return 'Registro nao encontrado.'
  if (status && status >= 500) return 'O servidor falhou. Tente de novo em instantes.'

  return 'Ocorreu um erro inesperado.'
}

/**
 * Os erros de campo do 400 de Bean Validation, no formato que o react-hook-form
 * consome. E o que permite marcar o input errado em vez de mostrar um alerta
 * solto - mesmo para uma regra que so o servidor conhece, como CPF duplicado.
 */
export function camposInvalidos(e: unknown): Record<string, string> {
  const campos = corpoDeErro(e)?.campos ?? []
  return Object.fromEntries(campos.map((c) => [c.campo, c.mensagem]))
}
