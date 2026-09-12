const CHAVE = 'teste-pratico.token'

/**
 * Guarda o JWT em localStorage.
 *
 * Trade-off assumido: localStorage e legivel por JavaScript, entao um XSS
 * consegue roubar o token. A alternativa mais segura seria cookie httpOnly +
 * SameSite, que o JavaScript nao le.
 *
 * Optei por localStorage porque a API e stateless com Bearer no header
 * Authorization - foi por isso, inclusive, que o CSRF pode ficar desligado na
 * SecurityConfig: sem cookie, o navegador nao anexa credencial sozinho e nao
 * existe vetor de CSRF. Trocar para cookie httpOnly exigiria mudar o backend
 * (ler cookie em vez de header) e reativar a protecao CSRF.
 *
 * Mitigacoes que reduzem o impacto: o token expira em 120 minutos e nao carrega
 * nada sensivel alem de id, CPF e role.
 *
 * Modulo separado, e nao dentro do contexto de auth, porque o interceptor do
 * axios precisa ler o token fora da arvore de componentes React.
 */
export const tokenStore = {
  ler(): string | null {
    try {
      return localStorage.getItem(CHAVE)
    } catch {
      // Navegador em modo privado ou com storage bloqueado. Sem token, a
      // aplicacao simplesmente pede login de novo - nao quebra.
      return null
    }
  },

  gravar(token: string): void {
    try {
      localStorage.setItem(CHAVE, token)
    } catch {
      /* idem: seguir sem persistir e melhor que estourar */
    }
  },

  limpar(): void {
    try {
      localStorage.removeItem(CHAVE)
    } catch {
      /* idem */
    }
  },
}
