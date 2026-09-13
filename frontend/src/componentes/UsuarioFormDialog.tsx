import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useCriarUsuario } from '@/api/usuarios'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { camposInvalidos, mensagemDeErro } from '@/lib/erros'
import {
  CamposUsuario,
  schemaUsuario,
  VALORES_VAZIOS,
  type FormularioUsuario,
} from './usuario-form'

/**
 * Cadastro de usuario pelo administrador, em dialogo sobre a listagem.
 *
 * Atende a capacidade "Pode cadastrar usuarios" da secao Administrador do
 * documento. Usa a MESMA rota publica POST /api/usuarios, e por consequencia o
 * usuario criado nasce sempre USUARIO_COMUM: o perfil e fixado em
 * UsuarioService e o DTO de entrada nao tem campo role, entao nao existe caminho
 * para criar outro administrador por aqui. Promover alguem a admin nao e pedido
 * pelo documento e nao foi inventado.
 *
 * Dialogo em vez de navegar para a pagina de cadastro: o admin nao perde a
 * listagem de vista, e a lista se atualiza atras do dialogo quando fecha.
 */
export function UsuarioFormDialog({
  aberto,
  onFechar,
}: {
  aberto: boolean
  onFechar: () => void
}) {
  const criar = useCriarUsuario()

  const form = useForm<FormularioUsuario>({
    resolver: zodResolver(schemaUsuario),
    defaultValues: VALORES_VAZIOS,
    mode: 'onBlur',
  })

  function enviar(dados: FormularioUsuario) {
    criar.mutate(dados, {
      onSuccess: (criado) => {
        // A invalidacao da chave de usuarios acontece no proprio hook, entao a
        // listagem atras do dialogo ja recarrega.
        toast.success(`Usuário ${criado.nome} cadastrado.`)
        form.reset(VALORES_VAZIOS)
        onFechar()
      },
      onError: (erro) => {
        for (const [campo, mensagem] of Object.entries(camposInvalidos(erro))) {
          form.setError(campo as keyof FormularioUsuario, { message: mensagem })
        }
      },
    })
  }

  // 409 (CPF ou e-mail ja cadastrado) e conflito de estado, nao erro de campo: o
  // corpo enviado esta correto, entao a mensagem vai para o alerta.
  const erro = criar.error
  const temErroDeCampo = erro ? Object.keys(camposInvalidos(erro)).length > 0 : false
  const mensagem = erro && !temErroDeCampo ? mensagemDeErro(erro) : null

  return (
    <Dialog open={aberto} onOpenChange={(estaAberto) => !estaAberto && onFechar()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
          <DialogDescription>
            O usuário é criado com perfil comum. Ele entra no sistema com o CPF e a senha
            informados aqui.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(enviar)} noValidate className="space-y-4">
            {mensagem && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{mensagem}</AlertDescription>
              </Alert>
            )}

            <CamposUsuario form={form} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onFechar} disabled={criar.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={criar.isPending}>
                {criar.isPending && <Loader2 className="animate-spin" aria-hidden />}
                {criar.isPending ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
