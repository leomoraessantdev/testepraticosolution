import { LogOut, MapPin, User, Users } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function Item({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-secondary text-secondary-foreground'
            : 'text-muted-foreground hover:text-foreground',
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
 * Os links de admin saem do ar para usuario comum - conveniencia de UI, nao
 * seguranca: quem forcar a URL recebe a tela de acesso restrito do
 * RotaProtegida e, se insistir na API, um 403 do backend.
 */
export function Layout() {
  const { sessao, ehAdmin, sair } = useAuth()

  return (
    <div className="min-h-svh bg-muted/40">
      <header className="border-b bg-background">
        {/* flex-wrap em vez de menu hamburguer: sao no maximo tres links, e
            empilhar resolve a largura de telefone sem JavaScript nenhum. */}
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
          <Link to="/" className="mr-auto font-semibold">
            Usuários e Endereços
          </Link>

          <nav className="flex flex-wrap items-center gap-1">
            <Item to={`/usuarios/${sessao?.usuarioId}`}>
              <User className="size-4" aria-hidden />
              Meus dados
            </Item>

            {ehAdmin && (
              <>
                <Item to="/usuarios">
                  <Users className="size-4" aria-hidden />
                  Usuários
                </Item>
                <Item to="/enderecos">
                  <MapPin className="size-4" aria-hidden />
                  Endereços
                </Item>
              </>
            )}
          </nav>

          <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm text-muted-foreground">{sessao?.nome}</span>
              {/* Badge em vez de texto solto: o perfil e a mesma informacao que a
                  listagem de usuarios ja mostra assim, e com o admin chamado
                  "Administrador" o texto ficava repetido ("Administrador - admin"). */}
              {ehAdmin && <Badge variant="secondary">Admin</Badge>}
            </div>
            <Button variant="ghost" size="sm" onClick={sair}>
              <LogOut className="size-4" aria-hidden />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
