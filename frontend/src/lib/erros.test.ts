import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import { camposInvalidos, mensagemDeErro, statusDoErro, type ApiError } from './erros'

/** Monta um AxiosError com o corpo que o GlobalExceptionHandler produz. */
function erroDaApi(status: number, corpo: Partial<ApiError>): AxiosError {
  const resposta = { status, data: corpo } as AxiosResponse
  return new AxiosError('Request failed', String(status), undefined, undefined, resposta)
}

describe('mensagemDeErro', () => {
  it('prefere a mensagem escrita pelo backend, que e a mais especifica', () => {
    const erro = erroDaApi(409, {
      status: 409,
      erro: 'Conflito',
      mensagem: 'Ja existe um usuario cadastrado com este CPF.',
    })
    expect(mensagemDeErro(erro)).toBe('Ja existe um usuario cadastrado com este CPF.')
  })

  it('nunca vaza o texto tecnico do axios para o usuario', () => {
    const erro = erroDaApi(500, { status: 500, mensagem: 'Ocorreu um erro inesperado.' })
    expect(mensagemDeErro(erro)).not.toContain('Request failed')
    expect(mensagemDeErro(erro)).not.toContain('AxiosError')
  })

  it('explica a falha de rede, que nao tem corpo de resposta', () => {
    // Backend desligado, DNS, CORS barrado: a requisicao nem chegou. Sem este
    // caso o usuario veria "Ocorreu um erro inesperado", que nao ajuda em nada.
    const semResposta = new AxiosError('Network Error', 'ERR_NETWORK')
    expect(mensagemDeErro(semResposta)).toContain('servidor')
  })

  it('tem texto por familia de status quando o backend nao mandou mensagem', () => {
    expect(mensagemDeErro(erroDaApi(401, { status: 401 }))).toContain('Sess')
    expect(mensagemDeErro(erroDaApi(403, { status: 403 }))).toContain('permiss')
    expect(mensagemDeErro(erroDaApi(404, { status: 404 }))).toContain('encontrado')
    expect(mensagemDeErro(erroDaApi(503, { status: 503 }))).toContain('servidor')
  })

  it('degrada para mensagem generica diante de erro que nao e do axios', () => {
    expect(mensagemDeErro(new Error('boom'))).toBe('Ocorreu um erro inesperado.')
    expect(mensagemDeErro(null)).toBe('Ocorreu um erro inesperado.')
  })
})

describe('statusDoErro', () => {
  it('extrai o status para quem precisa distinguir 401 de 403', () => {
    // O interceptor do axios depende disso: 401 descarta o token, 403 nao.
    expect(statusDoErro(erroDaApi(403, { status: 403 }))).toBe(403)
    expect(statusDoErro(new Error('nao e axios'))).toBeUndefined()
  })
})

describe('camposInvalidos', () => {
  it('converte a lista de campos do 400 no formato do react-hook-form', () => {
    // E o que permite marcar o input errado em vez de um alerta solto.
    const erro = erroDaApi(400, {
      status: 400,
      mensagem: 'Um ou mais campos estao invalidos.',
      campos: [
        { campo: 'cpf', mensagem: 'CPF invalido' },
        { campo: 'email', mensagem: 'E-mail invalido' },
      ],
    })
    expect(camposInvalidos(erro)).toEqual({
      cpf: 'CPF invalido',
      email: 'E-mail invalido',
    })
  })

  it('devolve objeto vazio quando o erro nao tem campos', () => {
    // 409 e conflito de estado, nao erro de campo: a tela usa o vazio aqui para
    // decidir entre marcar input e mostrar alerta.
    expect(camposInvalidos(erroDaApi(409, { status: 409 }))).toEqual({})
    expect(camposInvalidos(new Error('boom'))).toEqual({})
  })
})
