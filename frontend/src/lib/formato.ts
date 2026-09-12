import { mascararCep, mascararCpf } from './validacao'

/**
 * Formatacao para exibicao. O inverso da normalizacao: o banco guarda cru, a
 * tela mostra formatado.
 */

/** "1995-06-15" -> "15/06/1995". */
export function formatarData(iso: string): string {
  // Quebra a string em vez de usar new Date(iso): o construtor interpreta
  // "1995-06-15" como meia-noite UTC e, em fuso negativo como o do Brasil,
  // toLocaleDateString exibiria o dia anterior.
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export function formatarCpf(cpf: string): string {
  return mascararCpf(cpf)
}

export function formatarCep(cep: string): string {
  return mascararCep(cep)
}

/** "Avenida Paulista, 1578 - Bela Vista, Sao Paulo/SP" */
export function enderecoEmUmaLinha(e: {
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  uf: string
}): string {
  const complemento = e.complemento ? ` (${e.complemento})` : ''
  return `${e.logradouro}, ${e.numero}${complemento} - ${e.bairro}, ${e.cidade}/${e.uf}`
}
