import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Marcador das telas ainda nao construidas da etapa 4.
 *
 * Existe para que nenhum link da navegacao morra em tela branca enquanto as
 * telas sao entregues uma por vez. Sai do projeto quando a ultima chegar.
 */
export function EmBreve({ titulo }: { titulo: string }) {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
          <CardDescription>Tela ainda não implementada nesta etapa.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/">Voltar</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
