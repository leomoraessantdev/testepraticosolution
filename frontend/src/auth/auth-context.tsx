import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, EVENTO_SESSAO_EXPIRADA } from '@/lib/api'
import { tokenStore } from '@/lib/token'
import { somenteDigitos } from '@/lib/validacao'
import type { LoginResponse, Role } from '@/tipos'

const CHAVE_SESSAO = 'teste-pratico.sessao'

export type Sessao = {
  usuarioId: number
  nome: string
  role: Role
}

type AuthContextValue = {
  sessao: Sessao | null
  autenticado: boolean
  /**
   * Conveniencia de UI APENAS.
   *
   * Um usuario comum consegue editar o localStorage e virar "ADMIN" aqui: os
   * menus de admin apareceriam e TODA chamada correspondente voltaria 403,
   * porque a autorizacao real mora no backend em duas camadas - por rota na
   * SecurityConfig e por regra em ControleAcesso. Esconder botao e UX, nao
   * seguranca.
   */
  ehAdmin: boolean
  entrar: (cpf: string, senha: string) => Promise<void>
  sair: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function lerSessaoPersistida(): Sessao | null {
  try {
    const cru = localStorage.getItem(CHAVE_SESSAO)
    return cru ? (JSON.parse(cru) as Sessao) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  // Estado inicial lido do storage de forma sincrona: sem isso, um F5 numa rota
  // protegida renderizaria um frame como "nao autenticado" e jogaria a pessoa
  // no login antes de a sessao ser restaurada.
  const [sessao, setSessao] = useState<Sessao | null>(() => {
    return tokenStore.ler() ? lerSessaoPersistida() : null
  })

  const sair = useCallback(() => {
    tokenStore.limpar()
    try {
      localStorage.removeItem(CHAVE_SESSAO)
    } catch {
      /* storage bloqueado: o estado em memoria abaixo ja encerra a sessao */
    }
    setSessao(null)

    // Limpar o cache do React Query no logout nao e detalhe: sem isso, quem
    // logasse em seguida na mesma aba veria, por um instante, os dados em cache
    // do usuario anterior antes do refetch.
    queryClient.clear()
  }, [queryClient])

  const entrar = useCallback(async (cpf: string, senha: string) => {
    // Manda o CPF so com digitos. A mascara existe para quem digita; o backend
    // normaliza tambem, entao isto e cortesia, nao dependencia.
    const { data } = await api.post<LoginResponse>('/api/auth/login', {
      cpf: somenteDigitos(cpf),
      senha,
    })

    const novaSessao: Sessao = {
      usuarioId: data.usuarioId,
      nome: data.nome,
      role: data.role,
    }

    // Token primeiro: o interceptor precisa dele antes de qualquer requisicao
    // disparada pela tela que vem depois do login.
    tokenStore.gravar(data.token)
    try {
      localStorage.setItem(CHAVE_SESSAO, JSON.stringify(novaSessao))
    } catch {
      /* sessao segue valida em memoria, so nao sobrevive ao refresh */
    }
    setSessao(novaSessao)
  }, [])

  // Ponte entre o interceptor do axios (fora do React) e o estado da aplicacao.
  // E o que faz um 401 em qualquer tela derrubar a sessao uma unica vez, em vez
  // de cada tela ter de tratar token expirado.
  useEffect(() => {
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, sair)
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, sair)
  }, [sair])

  const valor = useMemo<AuthContextValue>(
    () => ({
      sessao,
      autenticado: sessao !== null,
      ehAdmin: sessao?.role === 'ADMIN',
      entrar,
      sair,
    }),
    [sessao, entrar, sair],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  }
  return ctx
}
