import { AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUsuarios } from '@/api/usuarios'
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
import { formatarCpf, formatarData } from '@/lib/formato'
import { mensagemDeErro } from '@/lib/erros'

/**
 * Listagem de todos os usuarios. Capacidade exclusiva do administrador.
 *
 * A restricao real esta no backend, em SecurityConfig (hasRole ADMIN na rota) e
 * em UsuarioService.listarTodos (exigirAdmin). Esta tela apenas nao e oferecida
 * a quem nao pode: forcar a URL resulta na tela de acesso restrito e, na API,
 * em 403.
 */
export function UsuariosPage() {
  const { data: usuarios, isPending, error } = useUsuarios()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuários</CardTitle>
        <CardDescription>
          Todos os usuários cadastrados. Selecione um para ver os dados e os endereços.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="size-4" aria-hidden />
            <AlertTitle>Não foi possível carregar</AlertTitle>
            <AlertDescription>{mensagemDeErro(error)}</AlertDescription>
          </Alert>
        )}

        {isPending && !error && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {usuarios && usuarios.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum usuário cadastrado.
          </p>
        )}

        {usuarios && usuarios.length > 0 && (
          /* overflow-x-auto: a tabela e o unico elemento que pode passar da
             largura da tela; o corpo da pagina nunca rola na horizontal. */
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  {/* Colunas secundarias somem no telefone em vez de espremer
                      a tabela inteira. */}
                  <TableHead className="hidden sm:table-cell">E-mail</TableHead>
                  <TableHead className="hidden md:table-cell">Nascimento</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatarCpf(u.cpf)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{u.email}</TableCell>
                    <TableCell className="hidden whitespace-nowrap md:table-cell">
                      {formatarData(u.dataNascimento)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {u.role === 'ADMIN' ? 'Admin' : 'Comum'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/usuarios/${u.id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
