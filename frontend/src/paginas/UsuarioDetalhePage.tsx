import { AlertCircle, MapPin, Plus } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useDefinirPrincipal, useExcluirEndereco } from '@/api/enderecos'
import { useUsuario } from '@/api/usuarios'
import { useAuth } from '@/auth/auth-context'
import {
  Avatar,
  CabecalhoPagina,
  ChipCep,
  Dado,
  PerfilBadge,
} from '@/componentes/elementos'
import { EnderecoFormDialog } from '@/componentes/EnderecoFormDialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { mensagemDeErro } from '@/lib/erros'
import { enderecoEmUmaLinha, formatarCep, formatarCpf, formatarData } from '@/lib/formato'
import { cn } from '@/lib/utils'
import type { EnderecoResponse } from '@/tipos'

/** Segunda linha do endereco: complemento, bairro, cidade/UF. */
function detalhe(e: EnderecoResponse): string {
  const partes = [e.complemento, `${e.bairro}, ${e.cidade}/${e.uf}`].filter(Boolean)
  return partes.join(' · ')
}

/**
 * Dados do usuario e a lista de enderecos dele, com as acoes de endereco.
 *
 * Uma so requisicao: GET /api/usuarios/{id} devolve o usuario COM os enderecos,
 * composto no backend. Buscar as duas coisas em paralelo custaria duas idas ao
 * servidor para montar uma tela.
 *
 * Serve tanto o admin (qualquer id) quanto o usuario comum (o proprio id). Quem
 * tentar o id de outra pessoa recebe 403 do backend e ve a mensagem - a regra e
 * do servidor, esta tela so a exibe.
 */
export function UsuarioDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const usuarioId = id ? Number(id) : undefined
  const { sessao, ehAdmin } = useAuth()

  const { data: usuario, isPending, error } = useUsuario(usuarioId)

  const definirPrincipal = useDefinirPrincipal(usuarioId ?? 0)
  const excluir = useExcluirEndereco(usuarioId ?? 0)

  const [formAberto, setFormAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<EnderecoResponse | undefined>()
  const [aExcluir, setAExcluir] = useState<EnderecoResponse | undefined>()

  const souEu = sessao?.usuarioId === usuarioId

  function abrirNovo() {
    setEmEdicao(undefined)
    setFormAberto(true)
  }

  function abrirEdicao(endereco: EnderecoResponse) {
    setEmEdicao(endereco)
    setFormAberto(true)
  }

  function confirmarExclusao() {
    if (!aExcluir) return
    const era = aExcluir
    excluir.mutate(era.id, {
      onSuccess: () => {
        // A mensagem depende da regra que acabou de rodar no servidor: ao
        // excluir o principal, outro endereco e promovido automaticamente.
        toast.success(
          era.principal
            ? 'Endereço excluído. Outro endereço passou a ser o principal.'
            : 'Endereço excluído.',
        )
        setAExcluir(undefined)
      },
      onError: (erro) => toast.error(mensagemDeErro(erro)),
    })
  }

  if (error) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertCircle className="size-4" aria-hidden />
        <AlertTitle>Não foi possível carregar</AlertTitle>
        <AlertDescription>{mensagemDeErro(error)}</AlertDescription>
      </Alert>
    )
  }

  if (isPending || !usuario) {
    return (
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }

  const enderecos = usuario.enderecos

  return (
    <>
      <CabecalhoPagina
        titulo={usuario.nome}
        subtitulo={souEu ? 'Seus dados e endereços cadastrados' : 'Dados e endereços cadastrados'}
        acao={
          <Button onClick={abrirNovo}>
            <Plus className="size-4" aria-hidden />
            Novo endereço
          </Button>
        }
      />

      {/* Coluna fixa para o perfil, o resto para os enderecos. Abaixo de lg
          vira uma coluna so - o perfil e curto e nao vale espremer ao lado de
          linhas que ja disputam largura. */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <section className="h-fit rounded-xl border bg-card p-6">
          <Avatar nome={usuario.nome} className="size-14 rounded-2xl text-base" />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{usuario.nome}</h2>
            <PerfilBadge role={usuario.role} />
          </div>

          <dl className="mt-5 space-y-4">
            <Dado rotulo="CPF" mono>
              {formatarCpf(usuario.cpf)}
            </Dado>
            <Dado rotulo="Data de nascimento" mono>
              {formatarData(usuario.dataNascimento)}
            </Dado>
          </dl>
        </section>

        <section className="overflow-hidden rounded-xl border bg-card">
          <header className="flex items-center justify-between gap-3 border-b px-5 py-4">
            <h2 className="font-semibold">Endereços</h2>
            <span className="text-sm text-muted-foreground">
              {enderecos.length} endereço{enderecos.length === 1 ? '' : 's'}
            </span>
          </header>

          {enderecos.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
              <MapPin className="size-8 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Nenhum endereço cadastrado. O primeiro será o principal automaticamente.
              </p>
              <Button variant="outline" size="sm" onClick={abrirNovo}>
                <Plus className="size-4" aria-hidden />
                Novo endereço
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {enderecos.map((e) => (
                <li key={e.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                  {/* O ponto marca o principal sem depender so do selo: na
                      varredura vertical da lista, a cor na margem e mais rapida
                      de achar do que ler o texto de cada linha. */}
                  <span
                    className={cn(
                      'mt-1.5 size-2 shrink-0 rounded-full sm:mt-0',
                      e.principal ? 'bg-brand' : 'bg-border',
                    )}
                    aria-hidden
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium break-words">
                        {e.logradouro}, {e.numero}
                      </span>
                      {e.principal && (
                        <span className="inline-flex items-center rounded-full border border-brand-border bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{detalhe(e)}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <ChipCep>{formatarCep(e.cep)}</ChipCep>

                    {!e.principal && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={definirPrincipal.isPending}
                        onClick={() =>
                          definirPrincipal.mutate(e.id, {
                            onSuccess: () =>
                              toast.success('Endereço principal atualizado. O anterior deixou de ser.'),
                            onError: (erro) => toast.error(mensagemDeErro(erro)),
                          })
                        }
                      >
                        Tornar principal
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" onClick={() => abrirEdicao(e)}>
                      Editar
                    </Button>
                    {/* Exclusao e capacidade so do administrador (decisao 16 do
                        PLAN.md). Esconder o botao e UX; a garantia esta no
                        backend, que responde 403 a quem chamar a rota direto. */}
                    {ehAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setAExcluir(e)}
                      >
                        Excluir
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {enderecos.length > 0 && (
            /* A regra escrita onde ela acontece. O usuario descobre o
               comportamento antes de clicar, e nao por um toast depois. */
            <p className="border-t px-5 py-3 text-sm text-muted-foreground">
              Apenas um endereço pode ser o principal. Ao definir outro, o anterior deixa de ser
              automaticamente.
            </p>
          )}
        </section>
      </div>

      {usuarioId !== undefined && (
        /* key remonta o formulario ao trocar entre "novo" e "editar", para o
           react-hook-form recalcular os defaultValues. Sem isso, abrir a edicao
           depois de um cadastro mostraria os campos do anterior. */
        <EnderecoFormDialog
          key={emEdicao?.id ?? 'novo'}
          usuarioId={usuarioId}
          endereco={emEdicao}
          aberto={formAberto}
          onFechar={() => setFormAberto(false)}
        />
      )}

      <AlertDialog
        open={aExcluir !== undefined}
        onOpenChange={(aberto) => !aberto && setAExcluir(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este endereço?</AlertDialogTitle>
            <AlertDialogDescription>
              {aExcluir && enderecoEmUmaLinha(aExcluir)}
              {aExcluir?.principal && enderecos.length > 1 && (
                <>
                  {' '}
                  Este é o endereço principal: outro endereço passará a ser o principal
                  automaticamente.
                </>
              )}
              {aExcluir?.principal && enderecos.length === 1 && (
                <> Este é o único endereço. O usuário ficará sem nenhum endereço.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluir.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(evento) => {
                // preventDefault para o dialogo nao fechar antes da resposta do
                // servidor: se a exclusao falhar, o aviso precisa continuar la.
                evento.preventDefault()
                confirmarExclusao()
              }}
              disabled={excluir.isPending}
            >
              {excluir.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
