import axios from 'axios'
import { tokenStore } from './token'

/** Disparado quando a API responde 401: a sessao morreu, volte para o login. */
export const EVENTO_SESSAO_EXPIRADA = 'teste-pratico:sessao-expirada'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  // Sem timeout o navegador espera indefinidamente e a tela fica travada em
  // "carregando" sem explicacao.
  timeout: 15000,
})

/**
 * Anexa o Bearer em toda requisicao.
 *
 * Num interceptor, e nao em cada chamada: esquecer o header em um unico lugar
 * produziria um 401 dificil de rastrear. Le do tokenStore a cada requisicao, e
 * nao de uma variavel capturada, para sempre usar o token atual depois de um
 * novo login.
 */
api.interceptors.request.use((config) => {
  const token = tokenStore.ler()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * 401 e 403 sao tratados de formas DIFERENTES, e essa distincao e o ponto
 * central deste interceptor:
 *
 *   401 - nao autenticado: token ausente, expirado ou invalido. A credencial
 *         nao serve mais, entao descarta e manda para o login.
 *
 *   403 - autenticado, porem sem permissao. O token e valido e continua valido;
 *         deslogar aqui seria errado e cruel - a pessoa perderia a sessao por
 *         ter clicado em algo que nao podia. Passa adiante e a tela mostra a
 *         mensagem.
 *
 * O login e excecao: credencial errada ali tambem responde 401, mas nao existe
 * sessao para expirar. Sem esse filtro, uma senha errada dispararia o evento de
 * "sessao expirada" em cima da propria tela de login.
 */
api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const status = erro?.response?.status
    const url: string = erro?.config?.url ?? ''

    if (status === 401 && !url.includes('/api/auth/login')) {
      tokenStore.limpar()
      window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA))
    }

    return Promise.reject(erro)
  },
)
