import { AlertCircle, MapPin, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEnderecosGlobais, type EnderecoAdmin } from '@/api/enderecos'
import { CabecalhoPagina, SituacaoBadge } from '@/componentes/elementos'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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
import { formatarCep } from '@/lib/formato'
import { cn } from '@/lib/utils'

/** "1 endereço" / "6 endereços" — plural de verdade, em vez de "(s)". */
function plural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`
}

/** Segunda linha do endereco: complemento, bairro, cidade/UF. */
function detalhe(e: EnderecoAdmin): string {
  return [e.complemento, `${e.bairro}, ${e.cidade}/${e.uf}`].filter(Boolean).join(' · ')
}

/**
 * Todos os enderecos do sistema, com o dono de cada um. Capacidade exclusiva do
 * administrador, barrada no backend por rota (SecurityConfig) e por regra
 * (EnderecoService.listarTodos chama exigirAdmin).
 *
 * Paginado porque e a unica listagem que cresce sem limite: enderecos de todos
 * os usuarios. A consulta usa JOIN FETCH no backend para nao disparar uma query
 * por linha ao exibir o nome do dono, e vem ordenada por dono - o que permite o
 * agrupamento visual abaixo sem nenhum reagrupamento no cliente.
 */
export function EnderecosGlobaisPage() {
  const [pagina, setPagina] = useState(0)
  const { data, isPending, isFetching, error, refetch } = useEnderecosGlobais(pagina)

  const totalPaginas = data?.totalPaginas ?? 0
  const primeira = pagina === 0
  const ultima = totalPaginas === 0 || pagina >= totalPaginas - 1
  const linhas = data?.conteudo ?? []
  const donos = new Set(linhas.map((e) => e.usuarioId)).size

  return (
    <>
      <CabecalhoPagina
        titulo="Endereços"
        subtitulo={
          data
            ? // O total e global, mas a contagem de donos so enxerga a pagina
              // atual. Juntar os dois numa frase so vira mentira assim que
              // existir a segunda pagina, entao o "de N usuarios" so aparece
              // quando tudo cabe numa pagina.
              totalPaginas <= 1
              ? `${plural(data.totalElementos, 'endereço', 'endereços')} de ${plural(donos, 'usuário', 'usuários')}`
              : `${plural(data.totalElementos, 'endereço', 'endereços')} no sistema`
            : 'Endereços de todos os usuários'
        }
      />

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="size-4" aria-hidden />
          <AlertTitle>Não foi possível carregar os endereços</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{mensagemDeErro(error)}</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
              <RotateCcw className="size-4" aria-hidden />
              {isFetching ? 'Tentando...' : 'Tentar novamente'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isPending && !error && (
        <div className="space-y-4 rounded-xl border bg-card p-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {data && linhas.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-16 text-center">
          <MapPin className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado no sistema.</p>
        </div>
      )}

      {linhas.length > 0 && (
        <>
          {/* Cards abaixo de 768px: quatro colunas com endereco por extenso nao
              cabem em tela de telefone. */}
          <ul className="space-y-3 md:hidden">
            {linhas.map((e) => (
              <li key={e.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to={`/usuarios/${e.usuarioId}`}
                    className="font-medium hover:underline"
                  >
                    {e.usuarioNome}
                  </Link>
                  <SituacaoBadge principal={e.principal} />
                </div>
                <p className="mt-2 font-medium break-words">
                  {e.logradouro}, {e.numero}
                </p>
                <p className="text-sm text-muted-foreground">{detalhe(e)}</p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {formatarCep(e.cep)}
                </p>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Usuário</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>CEP</TableHead>
                    <TableHead className="text-right">Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((e, i) => {
                    // O backend ja devolve ordenado por dono, entao basta
                    // comparar com a linha anterior: repetir o nome em toda
                    // linha faria a coluna virar ruido, e agrupar no cliente
                    // seria refazer um trabalho que a consulta ja fez.
                    const primeiroDoGrupo = i === 0 || linhas[i - 1].usuarioId !== e.usuarioId

                    return (
                      <TableRow
                        key={e.id}
                        className={cn(
                          'hover:bg-transparent',
                          primeiroDoGrupo && i > 0 && 'border-t-2',
                        )}
                      >
                        <TableCell className="align-top">
                          {primeiroDoGrupo && (
                            <Link
                              to={`/usuarios/${e.usuarioId}`}
                              className="font-medium hover:underline"
                            >
                              {e.usuarioNome}
                            </Link>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {e.logradouro}, {e.numero}
                          </span>
                          <p className="text-sm text-muted-foreground">{detalhe(e)}</p>
                        </TableCell>
                        <TableCell className="font-mono whitespace-nowrap">
                          {formatarCep(e.cep)}
                        </TableCell>
                        <TableCell className="text-right">
                          <SituacaoBadge principal={e.principal} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
              <span className="text-sm text-muted-foreground">
                Página {pagina + 1} de {Math.max(totalPaginas, 1)} ·{' '}
                {plural(data?.totalElementos ?? 0, 'endereço', 'endereços')}
                {isFetching && ' · atualizando...'}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={primeira || isFetching}
                  onClick={() => setPagina((p) => Math.max(0, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={ultima || isFetching}
                  onClick={() => setPagina((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
