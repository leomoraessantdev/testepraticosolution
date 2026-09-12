/**
 * ============================================================================
 *  VALIDACAO DE UX - NAO E VALIDACAO DE SEGURANCA
 * ============================================================================
 *
 * Tudo neste arquivo existe para dar resposta imediata a quem digita: apontar
 * o campo errado antes de gastar uma ida ao servidor.
 *
 * NADA aqui protege o sistema. Qualquer pessoa abre o DevTools, remove a
 * validacao e manda o corpo que quiser; ou chama a API direto com curl, sem
 * passar por este codigo. A validacao que vale e a do backend, e ela roda de
 * novo em TODA requisicao:
 *
 *   - formato e digito verificador de CPF -> @Cpf + CpfValidator (Bean Validation)
 *   - unicidade de CPF e e-mail           -> UsuarioService + indices unicos uk_usuarios_cpf / uk_usuarios_email
 *   - formato de CEP                      -> @Pattern no DTO + CHECK ck_enderecos_cep
 *   - campos obrigatorios                 -> @NotBlank / @NotNull nos DTOs
 *
 * Ou seja: cada regra aqui tem um par no servidor. Se as duas divergirem, a do
 * servidor ganha - o cliente apenas mostraria a mensagem errada, nunca
 * deixaria passar dado invalido.
 *
 * O algoritmo de CPF abaixo e uma reimplementacao deliberada de CpfUtils.java.
 * Duplicacao consciente: nao existe como compartilhar codigo entre Java e
 * TypeScript neste projeto, e a alternativa (um endpoint so para validar CPF)
 * custaria uma requisicao por tecla digitada.
 */

/** Remove tudo que nao e digito. */
export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

/**
 * Valida CPF pelos digitos verificadores, nao so pelo tamanho.
 *
 * Espelha CpfUtils.valido() do backend, incluindo a rejeicao de sequencias
 * repetidas ("11111111111"), que passam no calculo mas nao sao CPFs validos.
 */
export function cpfValido(valor: string): boolean {
  const cpf = somenteDigitos(valor)

  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  const digito = (ate: number): number => {
    let soma = 0
    let peso = ate + 1
    for (let i = 0; i < ate; i++) {
      soma += Number(cpf[i]) * peso
      peso--
    }
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10])
}

/** CEP: exatamente 8 digitos. Espelha o @Pattern do CriarEnderecoRequest. */
export function cepValido(valor: string): boolean {
  return /^\d{8}$/.test(somenteDigitos(valor))
}

/**
 * Mascara de CPF aplicada durante a digitacao: 000.000.000-00.
 *
 * So a EXIBICAO leva mascara. O que vai para a API sao os digitos crus, porque
 * o banco guarda CPF sem mascara (CHECK ck_usuarios_cpf) - duas representacoes
 * do mesmo CPF quebrariam busca por igualdade e unicidade.
 */
export function mascararCpf(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11)

  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Mascara de CEP: 00000-000. Mesma regra: mascara so na tela. */
export function mascararCep(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 8)
  return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`
}
