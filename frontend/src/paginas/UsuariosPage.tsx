import { AlertCircle, ChevronRight, Plus, RotateCcw, Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUsuarios } from '@/api/usuarios'
import { Avatar, CabecalhoPagina, PerfilBadge } from '@/componentes/elementos'
import { UsuarioFormDialog } from '@/componentes/UsuarioFormDialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { somenteDigitos } from '@/lib/validacao'
import type { UsuarioResponse } from '@/tipos'

const ESQUELETO = [0, 1, 2, 3]

/**
 * Filtro no cliente, e nao no servidor.
 *
 * A listagem ja chega inteira nesta tela - e a rota do admin, sem paginacao -,
 * entao filtrar aqui responde a cada tecla sem ida ao servidor. Se um dia a
 * listagem paginar, a busca precisa virar parametro da API: filtrar so a pagina
 * atual daria a impressao de que o registro nao existe.
 *
 * O CPF e comparado por digitos, para "111.444" e "111444" acharem a mesma
 * pessoa - mesmo principio da normalizacao no backend.
 */
function filtrar(usuarios: UsuarioResponse[], busca: string): UsuarioResponse[] {
  const termo = busca.trim().toLowerCase()
  if (!termo) return usuarios

  const digitos = somenteDigitos(termo)

  return usuarios.filter((u) => {
    const porTexto =
      u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo)
    const porCpf = digitos.length > 0 && u.cpf.includes(digitos)
    return porTexto || porCpf
  })
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
  const [busca, setBusca] = useState('')
  const navigate = useNavigate()

  const visiveis = useMemo(() => filtrar(usuarios ?? [], busca), [usuarios, busca])

  const semNenhum = usuarios !== undefined && usuarios.length === 0
  const semResultado = usuarios !== undefined && usuarios.length > 0 && visiveis.length === 0

  return (
    <>
      <CabecalhoPagina
        titulo="Usuários"
        subtitulo={
          usuarios
            ? `${visiveis.length} de ${usuarios.length} ${usuarios.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}`
            : 'Todos os usuários cadastrados'
        }
        acao={
          <>
            <div className="relative">
              <Search
                className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, CPF ou e-mail"
                aria-label="Buscar usuários"
                className="w-full pl-9 sm:w-72"
              />
            </div>
            <Button onClick={() => setFormAberto(true)}>
              <Plus className="size-4" aria-hidden />
              Novo usuário
            </Button>
          </>
        }
      />

      {/* ---------- ESTADO 1: erro de requisicao ---------- */}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="size-4" aria-hidden />
          <AlertTitle>Não foi possível carregar os usuários</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{mensagemDeErro(error)}</p>
            {/* refetch do React Query em vez de recarregar a pagina: mantem o
                resto do cache e nao custa um boot inteiro da aplicacao. */}
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isRefetching}>
              <RotateCcw className="size-4" aria-hidden />
              {isRefetching ? 'Tentando...' : 'Tentar novamente'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ---------- ESTADO 2: carregando ---------- */}
      {isPending && !error && (
        <div className="rounded-xl border bg-card p-4">
          {/* Esqueleto no formato da linha real. Um spinner central nao diz
              quanto conteudo vem nem onde, e a tela salta quando chega. */}
          <div className="space-y-4">
            {ESQUELETO.map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="hidden h-5 w-32 md:block" />
                <Skeleton className="hidden h-5 w-24 md:block" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- ESTADO 3: nenhum usuario cadastrado ---------- */}
      {semNenhum && (
        <div className="flex flex-col items-center gap-4 rounded-xl border bg-card py-16 text-center">
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

      {/* ---------- ESTADO 4: a busca nao achou nada ---------- */}
      {semResultado && (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-16 text-center">
          <Search className="size-8 text-muted-foreground" aria-hidden />
          <div>
            {/* Distinto de "nenhum usuario cadastrado": aqui existem usuarios,
                so nenhum casa com o termo. Oferecer "cadastrar" seria a acao
                errada. */}
            <p className="font-medium">Nenhum usuário encontrado</p>
            <p className="text-sm text-muted-foreground">
              Nada corresponde a <span className="font-medium text-foreground">{busca}</span>.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setBusca('')}>
            Limpar busca
          </Button>
        </div>
      )}

      {/* ---------- CONTEUDO: cards abaixo de 768px ---------- */}
      {visiveis.length > 0 && (
        <ul className="space-y-3 md:hidden">
          {visiveis.map((u) => (
            <li key={u.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start gap-3">
                <Avatar nome={u.nome} />
                <div className="min-w-0 flex-1">
                  {/* Nome em destaque: e o que identifica a linha, e no card nao
                      existe cabecalho de coluna para dar esse papel. */}
                  <Link
                    to={`/usuarios/${u.id}`}
                    className="block font-semibold break-words hover:underline"
                  >
                    {u.nome}
                  </Link>
                  <p className="text-sm break-all text-muted-foreground">{u.email}</p>
                </div>
                <PerfilBadge role={u.role} />
              </div>

              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">CPF</dt>
                  <dd className="font-mono">{formatarCpf(u.cpf)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Nascimento</dt>
                  <dd className="font-mono">{formatarData(u.dataNascimento)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Endereços</dt>
                  <dd className="font-medium">{u.totalEnderecos}</dd>
                </div>
              </dl>

              <Button asChild variant="outline" className="mt-4 w-full">
                <Link to={`/usuarios/${u.id}`}>Ver dados e endereços</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* ---------- CONTEUDO: tabela de 768px para cima ---------- */}
      {visiveis.length > 0 && (
        <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Usuário</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Endereços</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((u) => (
                <TableRow
                  key={u.id}
                  // Linha inteira clicavel para o mouse; o nome continua sendo um
                  // link de verdade, entao o teclado e o leitor de tela tambem
                  // alcancam o destino.
                  onClick={() => navigate(`/usuarios/${u.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar nome={u.nome} />
                      <div className="min-w-0">
                        <Link
                          to={`/usuarios/${u.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium hover:underline"
                        >
                          {u.nome}
                        </Link>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono whitespace-nowrap">{formatarCpf(u.cpf)}</TableCell>
                  <TableCell className="font-mono whitespace-nowrap">
                    {formatarData(u.dataNascimento)}
                  </TableCell>
                  <TableCell>
                    <PerfilBadge role={u.role} />
                  </TableCell>
                  <TableCell className="tabular-nums">{u.totalEnderecos}</TableCell>
                  <TableCell>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <UsuarioFormDialog aberto={formAberto} onFechar={() => setFormAberto(false)} />
    </>
  )
}
