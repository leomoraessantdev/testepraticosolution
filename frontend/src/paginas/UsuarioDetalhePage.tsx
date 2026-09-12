import { AlertCircle, MapPin, Plus, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useDefinirPrincipal, useExcluirEndereco } from '@/api/enderecos'
import { useUsuario } from '@/api/usuarios'
import { useAuth } from '@/auth/auth-context'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { mensagemDeErro } from '@/lib/erros'
import { enderecoEmUmaLinha, formatarCep, formatarCpf, formatarData } from '@/lib/formato'
import type { EnderecoResponse } from '@/tipos'

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
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const enderecos = usuario.enderecos

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>{usuario.nome}</CardTitle>
              <CardDescription>
                {souEu ? 'Seus dados' : 'Dados do usuário'}
              </CardDescription>
            </div>
            <Badge variant={usuario.role === 'ADMIN' ? 'default' : 'secondary'}>
              {usuario.role === 'ADMIN' ? 'Administrador' : 'Usuário comum'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Grade de uma coluna no telefone, duas a partir de sm. */}
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">CPF</dt>
              <dd className="font-medium">{formatarCpf(usuario.cpf)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Data de nascimento</dt>
              <dd className="font-medium">{formatarData(usuario.dataNascimento)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">E-mail</dt>
              <dd className="font-medium break-all">{usuario.email}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Endereços</CardTitle>
              <CardDescription>
                {enderecos.length === 0
                  ? 'Nenhum endereço cadastrado'
                  : `${enderecos.length} endereço(s) · apenas um pode ser o principal`}
              </CardDescription>
            </div>
            <Button onClick={abrirNovo} size="sm">
              <Plus className="size-4" aria-hidden />
              Novo endereço
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {enderecos.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <MapPin className="size-8 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Cadastre o primeiro endereço. Ele será o principal automaticamente.
              </p>
            </div>
          )}

          <ul className="divide-y">
            {enderecos.map((e) => (
              <li key={e.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{formatarCep(e.cep)}</span>
                    {e.principal && (
                      <Badge>
                        <Star className="size-3" aria-hidden />
                        Principal
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{enderecoEmUmaLinha(e)}</p>
                </div>

                {/* Empilha no telefone, alinha em linha a partir de sm. */}
                <div className="flex flex-wrap gap-2">
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
                      <Star className="size-4" aria-hidden />
                      Tornar principal
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => abrirEdicao(e)}>
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setAExcluir(e)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          {ehAdmin && !souEu && enderecos.length > 0 && (
            <>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground">
                Você está editando os endereços de outro usuário como administrador.
              </p>
            </>
          )}
        </CardContent>
      </Card>

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
    </div>
  )
}
