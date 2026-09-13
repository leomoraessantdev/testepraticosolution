import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth/auth-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Avatar, Marca } from './elementos'

function Aba({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          // A borda existe sempre, transparente quando inativa: sem isso o item
          // ativo ficaria 2px mais alto e a linha inteira saltaria ao navegar.
          'border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors',
          isActive
            ? 'border-brand text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )
      }
    >
      {children}
    </NavLink>
  )
}

/**
 * Moldura das telas autenticadas.
 *
 * Os itens de admin somem para usuario comum - conveniencia de UI, nao
 * seguranca: quem forcar a URL recebe a tela de acesso restrito e, na API, 403.
 */
export function Layout() {
  const { sessao, ehAdmin, sair } = useAuth()

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4">
          <Link to="/" className="py-4">
            <Marca />
          </Link>

          {/* A navegacao rola na horizontal em tela estreita em vez de virar
              menu sanduiche: sao no maximo tres itens curtos, e um menu
              escondido custaria um toque a mais para nada. */}
          <nav className="-mb-px order-3 flex w-full items-center gap-6 overflow-x-auto md:order-none md:w-auto">
            <Aba to={`/usuarios/${sessao?.usuarioId}`}>Meus dados</Aba>
            {ehAdmin && (
              <>
                <Aba to="/usuarios">Usuários</Aba>
                <Aba to="/enderecos">Endereços</Aba>
              </>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-3 py-2">
            <span className="hidden h-8 w-px bg-border sm:block" aria-hidden />
            <Avatar nome={sessao?.nome ?? ''} className="size-8" />
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-medium">{sessao?.nome}</span>
              <span className="block text-xs text-muted-foreground">
                {ehAdmin ? 'Administrador' : 'Usuário comum'}
              </span>
            </span>
            <Button variant="ghost" size="sm" onClick={sair}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  )
}
