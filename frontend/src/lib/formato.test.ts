import { beforeAll, describe, expect, it } from 'vitest'
import { enderecoEmUmaLinha, formatarCep, formatarCpf, formatarData } from './formato'

describe('formatarData', () => {
  beforeAll(() => {
    // Fuso negativo de proposito. E nele que a implementacao ingenua erra, e o
    // Brasil inteiro esta em fuso negativo - entao o bug apareceria em
    // producao e nao na maquina de quem escreveu o codigo em UTC.
    process.env.TZ = 'America/Sao_Paulo'
  })

  it('converte ISO para dd/mm/aaaa', () => {
    expect(formatarData('1995-06-15')).toBe('15/06/1995')
    expect(formatarData('1985-03-12')).toBe('12/03/1985')
    expect(formatarData('1988-11-02')).toBe('02/11/1988')
  })

  it('NAO desloca o dia em fuso negativo — a armadilha que motivou a implementacao', () => {
    const iso = '1995-06-15'

    // A forma ingenua: new Date("1995-06-15") e interpretado como meia-noite
    // UTC. Em America/Sao_Paulo (UTC-3) isso vira 14/06 as 21h local, e a data
    // de nascimento de alguem aparece um dia mais cedo na tela.
    const ingenuo = new Date(iso).toLocaleDateString('pt-BR')

    // A nossa implementacao acerta em qualquer fuso, porque nao constroi Date.
    expect(formatarData(iso)).toBe('15/06/1995')

    // A comparacao com a forma ingenua so faz sentido em fuso ATRAS de UTC.
    // getTimezoneOffset() > 0 significa exatamente isso. O guard evita que o
    // teste falhe por motivo errado se a mudanca de TZ acima nao surtir efeito
    // em algum ambiente (CI em UTC, por exemplo) - a falha seria do teste, nao
    // do codigo.
    if (new Date(iso).getTimezoneOffset() > 0) {
      expect(ingenuo).toBe('14/06/1995')
      expect(ingenuo).not.toBe(formatarData(iso))
    }
  })

  it('funciona na virada do ano, onde o deslocamento troca tambem o ano', () => {
    expect(formatarData('2000-01-01')).toBe('01/01/2000')
  })
})

describe('formatarCpf e formatarCep', () => {
  it('formatam o valor cru vindo do banco', () => {
    // O banco guarda so digitos; a mascara e responsabilidade da exibicao.
    expect(formatarCpf('52998224725')).toBe('529.982.247-25')
    expect(formatarCep('01310100')).toBe('01310-100')
  })
})

describe('enderecoEmUmaLinha', () => {
  const base = {
    logradouro: 'Avenida Paulista',
    numero: '1578',
    complemento: null as string | null,
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP',
  }

  it('monta a linha sem complemento', () => {
    expect(enderecoEmUmaLinha(base)).toBe(
      'Avenida Paulista, 1578 - Bela Vista, São Paulo/SP',
    )
  })

  it('inclui o complemento entre parenteses quando existe', () => {
    expect(enderecoEmUmaLinha({ ...base, complemento: 'Apto 52' })).toBe(
      'Avenida Paulista, 1578 (Apto 52) - Bela Vista, São Paulo/SP',
    )
  })

  it('complemento nulo nao vira a string "null" na tela', () => {
    // O backend grava NULL quando o campo vem vazio; concatenar sem checar
    // imprimiria "(null)" para o usuario.
    expect(enderecoEmUmaLinha(base)).not.toContain('null')
  })
})
