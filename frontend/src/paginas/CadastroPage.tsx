import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCriarUsuario } from '@/api/usuarios'
import { useAuth } from '@/auth/auth-context'
import { Marca } from '@/componentes/elementos'
import {
  CamposUsuario,
  schemaUsuario,
  VALORES_VAZIOS,
  type FormularioUsuario,
} from '@/componentes/usuario-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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
    <main className="flex min-h-svh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Marca className="mb-8" />

        <h1 className="text-4xl font-bold tracking-tight">Criar conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Preencha seus dados para se cadastrar.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(enviar)} noValidate className="mt-8 space-y-4">
            {mensagem && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{mensagem}</AlertDescription>
              </Alert>
            )}

            <CamposUsuario form={form} />

            <Button type="submit" className="w-full" size="lg" disabled={criar.isPending}>
              {criar.isPending && <Loader2 className="animate-spin" aria-hidden />}
              {criar.isPending ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </form>
        </Form>

        <p className="mt-5 text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-brand hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
