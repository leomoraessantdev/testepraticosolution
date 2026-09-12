import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/auth/auth-context'
import { RotaProtegida } from '@/componentes/RotaProtegida'
import { Toaster } from '@/components/ui/sonner'
import { EmBreve } from '@/paginas/EmBreve'
import { HomePage } from '@/paginas/HomePage'
import { LoginPage } from '@/paginas/LoginPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * O padrao do React Query e 3 tentativas. Para erro de cliente isso esta
       * errado: um 403 nao muda de resposta por insistir, e repetir tres vezes
       * so atrasa a mensagem de erro na tela e enche o log do servidor de
       * tentativa de acesso indevido. Repete apenas o que pode ser transitorio.
       */
      retry: (tentativas, erro: unknown) => {
        const status = (erro as { response?: { status?: number } })?.response?.status
        if (status && status >= 400 && status < 500) return false
        return tentativas < 2
      },
      staleTime: 30_000,
      // O padrao refaz a consulta a cada volta de foco na janela. Com
      // staleTime curto isso viraria rajada de requisicoes ao alternar de aba.
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    // Ordem proposital: o AuthProvider usa useQueryClient para limpar o cache
    // no logout, entao precisa estar DENTRO do QueryClientProvider.
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<EmBreve titulo="Cadastro de usuário" />} />

            <Route element={<RotaProtegida />}>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/usuarios/:id"
                element={<EmBreve titulo="Detalhe do usuário" />}
              />
            </Route>

            <Route element={<RotaProtegida somenteAdmin />}>
              <Route path="/usuarios" element={<EmBreve titulo="Usuários" />} />
              <Route path="/enderecos" element={<EmBreve titulo="Todos os endereços" />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  )
}
