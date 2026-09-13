import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCriarUsuario } from '@/api/usuarios'
import { useAuth } from '@/auth/auth-context'
import {
  CamposUsuario,
  schemaUsuario,
  VALORES_VAZIOS,
  type FormularioUsuario,
} from '@/componentes/usuario-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { camposInvalidos, mensagemDeErro } from '@/lib/erros'

/**
 * Auto-cadastro publico. Sem ele nao haveria como um usuario novo entrar no
 * sistema (decisao 9 do PLAN.md).
 *
 * Schema e campos vem de componentes/usuario-form, compartilhados com o dialogo
 * do administrador: as regras de validacao precisam divergir juntas ou nunca.
 */
export function CadastroPage() {
  const { autenticado } = useAuth()
  const navigate = useNavigate()
  const criar = useCriarUsuario()

  const form = useForm<FormularioUsuario>({
    resolver: zodResolver(schemaUsuario),
    defaultValues: VALORES_VAZIOS,
    // Valida ao sair do campo, nao a cada tecla: marcar "CPF invalido" no
    // terceiro digito, enquanto a pessoa digita, e ruido.
    mode: 'onBlur',
  })

  if (autenticado) {
    return <Navigate to="/" replace />
  }

  function enviar(dados: FormularioUsuario) {
    criar.mutate(dados, {
      onSuccess: () => {
        toast.success('Cadastro concluído. Entre com seu CPF e senha.')
        navigate('/login', { replace: true })
      },
      onError: (erro) => {
        // O 400 do Bean Validation vem com a lista de campos: marca cada input
        // em vez de mostrar um alerta solto.
        for (const [campo, mensagem] of Object.entries(camposInvalidos(erro))) {
          form.setError(campo as keyof FormularioUsuario, { message: mensagem })
        }
      },
    })
  }

  // 409 e conflito de estado (CPF ou e-mail ja cadastrado), nao erro de campo: o
  // corpo enviado esta correto, entao a mensagem vai para o alerta.
  const erro = criar.error
  const temErroDeCampo = erro ? Object.keys(camposInvalidos(erro)).length > 0 : false
  const mensagem = erro && !temErroDeCampo ? mensagemDeErro(erro) : null

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Criar conta</CardTitle>
          <CardDescription>Preencha seus dados para se cadastrar.</CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(enviar)} noValidate>
            <CardContent className="space-y-4">
              {mensagem && (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>{mensagem}</AlertDescription>
                </Alert>
              )}

              <CamposUsuario form={form} />
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full" disabled={criar.isPending}>
                {criar.isPending && <Loader2 className="animate-spin" aria-hidden />}
                {criar.isPending ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
              <p className="text-sm text-muted-foreground">
                Já tem conta?{' '}
                <Link to="/login" className="font-medium text-foreground underline">
                  Entrar
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </main>
  )
}
