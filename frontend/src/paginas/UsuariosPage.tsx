import { AlertCircle, Plus, RotateCcw, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUsuarios } from '@/api/usuarios'
import { UsuarioFormDialog } from '@/componentes/UsuarioFormDialog'
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
import { formatarCpf, formatarData } from '@/lib/formato'
import type { UsuarioResponse } from '@/tipos'

/** Quantas linhas fantasma mostrar enquanto carrega. */
const ESQUELETO = [0, 1, 2, 3]

function PerfilBadge({ role }: { role: UsuarioResponse['role'] }) {
  return (
    <Badge variant={role === 'ADMIN' ? 'default' : 'secondary'}>
      {role === 'ADMIN' ? 'Admin' : 'Comum'}
    </Badge>
  )
}

/** Um par rotulo/valor do card. */
function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-sm text-muted-foreground">{rotulo}</dt>
      <dd className="min-w-0 truncate text-sm font-medium">{children}</dd>
    </div>
  )
}

/**
 * Listagem de todos os usuarios. Capacidade exclusiva do administrador.
 *
 * A restricao real esta no backend, em SecurityConfig (hasRole ADMIN na rota) e
 * em UsuarioService.listarTodos (exigirAdmin). Esta tela apenas nao e oferecida
 * a quem nao pode: forcar a URL resulta na tela de acesso restrito e, na API,
 * em 403.
 *
 * Abaixo de 768px a tabela vira cards empilhados. Nao e a tabela encolhida nem
 * colunas escondidas: seis colunas em tela de telefone ficam ilegiveis de
 * qualquer forma, e o par rotulo/valor nomeia cada campo sem depender do
 * cabecalho, que rolaria para fora da vista.
 */
export function UsuariosPage() {
  const { data: usuarios, isPending, error, refetch, isRefetching } = useUsuarios()
  const [formAberto, setFormAberto] = useState(false)

  const vazia = usuarios !== undefined && usuarios.length === 0

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Usuários</CardTitle>
              <CardDescription>
                {usuarios
                  ? `${usuarios.length} usuário(s) cadastrado(s)`
                  : 'Todos os usuários cadastrados'}
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setFormAberto(true)}>
              <Plus className="size-4" aria-hidden />
              Novo usuário
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* ---------- ESTADO 1: erro de requisicao ---------- */}
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertCircle className="size-4" aria-hidden />
              <AlertTitle>Não foi possível carregar os usuários</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{mensagemDeErro(error)}</p>
                {/* refetch do React Query em vez de recarregar a pagina: mantem
                    o resto do cache e nao custa um boot inteiro da aplicacao. */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void refetch()}
                  disabled={isRefetching}
                >
                  <RotateCcw className="size-4" aria-hidden />
                  {isRefetching ? 'Tentando...' : 'Tentar novamente'}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* ---------- ESTADO 2: carregando ---------- */}
          {isPending && !error && (
            <>
              {/* Esqueleto no formato de cada layout: linhas de tabela no
                  desktop, cards no telefone. Um spinner central nao diz quanto
                  conteudo vem nem onde, e a tela salta quando os dados chegam. */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Nascimento</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ESQUELETO.map((i) => (
                      <TableRow key={i}>
                        {ESQUELETO.concat([4, 5]).map((c) => (
                          <TableCell key={c}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <ul className="space-y-3 md:hidden">
                {ESQUELETO.map((i) => (
                  <li key={i} className="rounded-lg border p-4">
                    <Skeleton className="h-5 w-2/3" />
                    <div className="mt-3 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="mt-4 h-9 w-full" />
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* ---------- ESTADO 3: lista vazia ---------- */}
          {vazia && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <Users className="size-8 text-muted-foreground" aria-hidden />
              <div>
                <p className="font-medium">Nenhum usuário cadastrado</p>
                <p className="text-sm text-muted-foreground">
                  Cadastre o primeiro usuário para começar.
                </p>
              </div>
              <Button onClick={() => setFormAberto(true)}>
                <Plus className="size-4" aria-hidden />
                Cadastrar usuário
              </Button>
            </div>
          )}

          {/* ---------- CONTEUDO: cards abaixo de 768px ---------- */}
          {usuarios && usuarios.length > 0 && (
            <ul className="space-y-3 md:hidden">
              {usuarios.map((u) => (
                <li key={u.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Nome em destaque: e o que identifica a linha, e no card
                        nao existe cabecalho de coluna para dar esse papel. */}
                    <h3 className="min-w-0 break-words text-base font-semibold">{u.nome}</h3>
                    <PerfilBadge role={u.role} />
                  </div>

                  <dl className="mt-3 space-y-1.5">
                    <Campo rotulo="CPF">{formatarCpf(u.cpf)}</Campo>
                    <Campo rotulo="E-mail">{u.email}</Campo>
                    <Campo rotulo="Nascimento">{formatarData(u.dataNascimento)}</Campo>
                  </dl>

                  <Button asChild variant="outline" className="mt-4 w-full">
                    <Link to={`/usuarios/${u.id}`}>Ver</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {/* ---------- CONTEUDO: tabela de 768px para cima ---------- */}
          {usuarios && usuarios.length > 0 && (
            /* overflow-x-auto mesmo aqui: entre 768px e 900px as seis colunas
               ainda podem estourar, e so a tabela rola - nunca o corpo da pagina. */
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Nascimento</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nome}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatarCpf(u.cpf)}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatarData(u.dataNascimento)}
                      </TableCell>
                      <TableCell>
                        <PerfilBadge role={u.role} />
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

      <UsuarioFormDialog aberto={formAberto} onFechar={() => setFormAberto(false)} />
    </>
  )
}
