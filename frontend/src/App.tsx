import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/auth/auth-context'
import { Layout } from '@/componentes/Layout'
import { RotaProtegida } from '@/componentes/RotaProtegida'
import { Toaster } from '@/components/ui/sonner'

/**
 * Paginas carregadas sob demanda.
 *
 * Em um unico bundle, quem abre a tela de login baixa tambem as telas de
 * administrador que talvez nunca veja. Com o split, cada rota vira um arquivo
 * proprio e so chega ao navegador quando a pessoa navega ate ela.
 *
 * lazy() espera export default; as paginas usam export nomeado, dai o .then que
 * reembrulha. Preferi manter os nomes a trocar tudo para default so por causa
 * disso - o nome ajuda no stack trace e no autocomplete.
 */
const lazyPagina = <T extends Record<string, React.ComponentType>>(
  carregar: () => Promise<T>,
  nome: keyof T,
) => lazy(() => carregar().then((m) => ({ default: m[nome] })))

const LoginPage = lazyPagina(() => import('@/paginas/LoginPage'), 'LoginPage')
const CadastroPage = lazyPagina(() => import('@/paginas/CadastroPage'), 'CadastroPage')
const Inicio = lazyPagina(() => import('@/paginas/Inicio'), 'Inicio')
const UsuariosPage = lazyPagina(() => import('@/paginas/UsuariosPage'), 'UsuariosPage')
const UsuarioDetalhePage = lazyPagina(() => import('@/paginas/UsuarioDetalhePage'), 'UsuarioDetalhePage')
const EnderecosGlobaisPage = lazyPagina(() => import('@/paginas/EnderecosGlobaisPage'), 'EnderecosGlobaisPage')


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * O padrao do React Query e 3 tentativas. Para erro de cliente isso esta
       * errado: um 403 nao muda de resposta por insistir, so atrasa a mensagem
       * na tela e enche o log do servidor de tentativa de acesso indevido.
       * Repete apenas o que pode ser transitorio.
       */
      retry: (tentativas, erro: unknown) => {
        const status = (erro as { response?: { status?: number } })?.response?.status
        if (status && status >= 400 && status < 500) return false
        return tentativas < 2
      },
      staleTime: 30_000,
      // O padrao refaz a consulta a cada volta de foco na janela. Com staleTime
      // curto isso viraria rajada de requisicoes ao alternar de aba.
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
          {/* Suspense unico, em volta de todas as rotas: cada pagina e um
              arquivo separado agora, e o fallback cobre o instante entre clicar
              no link e o arquivo chegar. Uma barra fina no topo, e nao um
              spinner de tela cheia - em rede local o arquivo chega tao rapido
              que um bloco grande so produziria um flash. */}
          <Suspense fallback={<div className="h-1 w-full animate-pulse bg-primary/20" />}>
          <Routes>
            {/* Publicas: quem ainda nao tem token precisa alcancar as duas. */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<CadastroPage />} />

            <Route element={<RotaProtegida />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Inicio />} />

                {/* Admin em qualquer id, usuario comum no proprio. Quem tentar
                    o id de outra pessoa recebe 403 do backend. */}
                <Route path="/usuarios/:id" element={<UsuarioDetalhePage />} />

                {/* Aninhado DENTRO do Layout: negar acesso mantem a navegacao
                    na tela, em vez de deixar a pessoa presa numa pagina nua. */}
                <Route element={<RotaProtegida somenteAdmin />}>
                  <Route path="/usuarios" element={<UsuariosPage />} />
                  <Route path="/enderecos" element={<EnderecosGlobaisPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  )
}
