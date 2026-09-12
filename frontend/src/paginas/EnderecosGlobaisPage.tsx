import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEnderecosGlobais } from '@/api/enderecos'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mensagemDeErro } from '@/lib/erros'
import { enderecoEmUmaLinha, formatarCep } from '@/lib/formato'

/**
 * Todos os enderecos do sistema, com o dono de cada um. Capacidade exclusiva do
 * administrador, barrada no backend por rota (SecurityConfig) e por regra
 * (EnderecoService.listarTodos chama exigirAdmin).
 *
 * Paginado porque e a unica listagem que cresce sem limite: enderecos de todos
 * os usuarios. A consulta usa JOIN FETCH no backend para nao disparar uma query
 * por linha ao exibir o nome do dono.
 */
export function EnderecosGlobaisPage() {
  const [pagina, setPagina] = useState(0)
  const { data, isPending, isFetching, error } = useEnderecosGlobais(pagina)

  const totalPaginas = data?.totalPaginas ?? 0
  const primeira = pagina === 0
  const ultima = totalPaginas === 0 || pagina >= totalPaginas - 1

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos os endereços</CardTitle>
        <CardDescription>
          {data
            ? `${data.totalElementos} endereço(s) no sistema`
            : 'Endereços de todos os usuários'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="size-4" aria-hidden />
            <AlertTitle>Não foi possível carregar</AlertTitle>
            <AlertDescription>{mensagemDeErro(error)}</AlertDescription>
          </Alert>
        )}

        {isPending && !error && (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {data && data.conteudo.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum endereço cadastrado.
          </p>
        )}

        {data && data.conteudo.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>CEP</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.conteudo.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                      <Link to={`/usuarios/${e.usuarioId}`} className="underline">
                        {e.usuarioNome}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatarCep(e.cep)}</TableCell>
                    <TableCell className="min-w-[18rem]">{enderecoEmUmaLinha(e)}</TableCell>
                    <TableCell className="text-right">
                      {e.principal && <Badge>Principal</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              Página {pagina + 1} de {totalPaginas}
              {isFetching && ' · atualizando...'}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={primeira || isFetching}
                onClick={() => setPagina((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="size-4" aria-hidden />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={ultima || isFetching}
                onClick={() => setPagina((p) => p + 1)}
              >
                Próxima
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
