import { describe, expect, it } from 'vitest'
import { cepValido, cpfValido, mascararCep, mascararCpf, somenteDigitos } from './validacao'

/**
 * Estes testes existem por um motivo especifico: lib/validacao.ts e uma
 * REIMPLEMENTACAO do CpfUtils.java. Duas implementacoes da mesma regra em
 * linguagens diferentes divergem em silencio com o tempo.
 *
 * Os vetores abaixo sao os mesmos do CpfUtilsTest do backend. Se um dia os dois
 * discordarem, um dos dois quebra aqui.
 */
describe('cpfValido', () => {
  // Mesmos CPFs aceitos por CpfUtilsTest.aceitaValidos
  it.each(['52998224725', '11144477735', '39053344705', '529.982.247-25'])(
    'aceita CPF com digitos verificadores corretos: %s',
    (cpf) => expect(cpfValido(cpf)).toBe(true),
  )

  // Mesmos CPFs rejeitados por CpfUtilsTest.rejeitaInvalidos
  it.each([
    ['52998224724', 'ultimo digito trocado'],
    ['12345678901', 'digitos verificadores errados'],
    ['1234567890', 'curto demais'],
    ['123456789012', 'longo demais'],
    ['00000000000', 'sequencia repetida'],
    ['11111111111', 'sequencia repetida'],
    ['', 'vazio'],
  ])('rejeita %s (%s)', (cpf) => expect(cpfValido(cpf)).toBe(false))

  it('rejeita sequencia repetida que PASSA no calculo dos digitos', () => {
    // 11111111111 satisfaz a formula dos digitos verificadores. So nao e um CPF
    // valido porque a regra exclui sequencias. Sem a checagem explicita, este
    // caso passaria.
    expect(cpfValido('11111111111')).toBe(false)
    expect(cpfValido('22222222222')).toBe(false)
  })

  it('ignora a mascara ao validar', () => {
    expect(cpfValido('529.982.247-25')).toBe(true)
    expect(cpfValido('529982247-25')).toBe(true)
  })
})

describe('cepValido', () => {
  it('aceita 8 digitos, com ou sem mascara', () => {
    expect(cepValido('01310100')).toBe(true)
    expect(cepValido('01310-100')).toBe(true)
  })

  it('rejeita quantidade errada de digitos', () => {
    expect(cepValido('123')).toBe(false)
    expect(cepValido('013101000')).toBe(false)
    expect(cepValido('')).toBe(false)
  })

  it('rejeita texto que nao e numero', () => {
    expect(cepValido('abcdefgh')).toBe(false)
  })
})

describe('mascaras', () => {
  it('mascara o CPF progressivamente enquanto se digita', () => {
    expect(mascararCpf('529')).toBe('529')
    expect(mascararCpf('529982')).toBe('529.982')
    expect(mascararCpf('529982247')).toBe('529.982.247')
    expect(mascararCpf('52998224725')).toBe('529.982.247-25')
  })

  it('nao deixa passar do tamanho do CPF', () => {
    expect(mascararCpf('529982247259999')).toBe('529.982.247-25')
  })

  it('mascara o CEP', () => {
    expect(mascararCep('01310')).toBe('01310')
    expect(mascararCep('01310100')).toBe('01310-100')
    expect(mascararCep('013101009999')).toBe('01310-100')
  })

  it('remascarar um valor ja mascarado nao duplica separadores', () => {
    // O onChange do formulario chama a mascara a cada tecla, sobre o valor que
    // ela mesma produziu. Sem normalizar antes, viraria "529..982".
    expect(mascararCpf(mascararCpf('52998224725'))).toBe('529.982.247-25')
    expect(mascararCep(mascararCep('01310100'))).toBe('01310-100')
  })

  it('somenteDigitos e o que vai para a API', () => {
    // O banco guarda sem mascara (CHECK ck_usuarios_cpf / ck_enderecos_cep).
    expect(somenteDigitos('529.982.247-25')).toBe('52998224725')
    expect(somenteDigitos('01310-100')).toBe('01310100')
  })
})
