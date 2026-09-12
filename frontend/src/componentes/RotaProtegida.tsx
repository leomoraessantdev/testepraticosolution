import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/auth-context'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

/**
 * Portao de rota no cliente.
 *
 * E conveniencia de navegacao, NAO controle de acesso: ninguem e impedido de
 * nada por este componente. Quem garante e o backend - SecurityConfig por rota e
 * ControleAcesso por regra. Se alguem burlar isto, ve a tela vazia e cada
 * requisicao volta 401 ou 403.
 */
export function RotaProtegida({ somenteAdmin = false }: { somenteAdmin?: boolean }) {
  const { autenticado, ehAdmin } = useAuth()
  const location = useLocation()

  if (!autenticado) {
    // Guarda de onde a pessoa veio para devolve-la ao destino depois do login,
    // em vez de jogar todo mundo na home.
    return <Navigate to="/login" replace state={{ de: location.pathname }} />
  }

  if (somenteAdmin && !ehAdmin) {
    // Mensagem, e nao redirect: redirecionar em silencio faz parecer bug. A
    // pessoa esta autenticada, so nao tem permissao - mesma semantica do 403.
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <Alert variant="destructive" role="alert">
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Esta área é exclusiva de administradores.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return <Outlet />
}
