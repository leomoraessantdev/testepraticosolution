import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Placeholder temporario da etapa 4.
 *
 * Existe para que o login tenha destino e possa ser verificado ponta a ponta.
 * Sera substituido pelas telas reais nas proximas etapas.
 */
export function HomePage() {
  const { sessao, ehAdmin, sair } = useAuth()

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Olá, {sessao?.nome}</CardTitle>
          <CardDescription>
            Perfil: {ehAdmin ? 'Administrador' : 'Usuário comum'} · id {sessao?.usuarioId}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to={`/usuarios/${sessao?.usuarioId}`}>Meus dados</Link>
          </Button>
          {ehAdmin && (
            <Button asChild variant="outline">
              <Link to="/usuarios">Usuários</Link>
            </Button>
          )}
          <Button variant="ghost" onClick={sair}>
            Sair
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
