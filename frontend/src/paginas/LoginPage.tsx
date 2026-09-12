import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/auth/auth-context'
import { mensagemDeErro, statusDoErro } from '@/lib/erros'
import { cpfValido, mascararCpf } from '@/lib/validacao'

/**
 * Validacao de UX. O backend valida de novo - ver o cabecalho de lib/validacao.ts.
 *
 * Assimetria consciente com o backend: o LoginRequest do servidor exige apenas
 * @NotBlank no CPF, e nao o digito verificador. A razao esta comentada la -
 * validar formato no login nao protege nada e revelaria ao atacante quais
 * formatos o sistema aceita. Aqui o calculo roda porque o proposito e outro:
 * avisar de um erro de digitacao antes de gastar uma ida ao servidor. Nao ha
 * vazamento, porque o codigo do cliente ja esta nas maos de quem abre o
 * DevTools.
 */
const schemaLogin = z.object({
  cpf: z
    .string()
    .min(1, 'Informe o CPF')
    .refine(cpfValido, 'CPF invalido. Confira os numeros.'),
  senha: z.string().min(1, 'Informe a senha'),
})

type FormularioLogin = z.infer<typeof schemaLogin>

export function LoginPage() {
  const { entrar, autenticado } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const form = useForm<FormularioLogin>({
    resolver: zodResolver(schemaLogin),
    defaultValues: { cpf: '', senha: '' },
    // Valida ao sair do campo, nao a cada tecla: marcar "CPF invalido" no
    // terceiro digito, quando a pessoa ainda esta digitando, e ruido.
    mode: 'onBlur',
  })

  const login = useMutation({
    mutationFn: ({ cpf, senha }: FormularioLogin) => entrar(cpf, senha),
    onSuccess: () => {
      // Volta para onde a pessoa tentou ir antes de ser mandada ao login.
      const destino = (location.state as { de?: string } | null)?.de ?? '/'
      navigate(destino, { replace: true })
    },
  })

  // Ja logado nao ve tela de login: replace para o botao "voltar" do navegador
  // nao trazer de volta para ca.
  if (autenticado) {
    return <Navigate to="/" replace />
  }

  const erro = login.error
  // 401 aqui e credencial errada, nao sessao expirada. A mensagem do backend e
  // generica de proposito (nao diz se o CPF existe), entao so a repassamos.
  const mensagem =
    statusDoErro(erro) === 401 ? 'CPF ou senha incorretos.' : erro ? mensagemDeErro(erro) : null

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Entrar</CardTitle>
          <CardDescription>Acesse com seu CPF e senha.</CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((dados) => login.mutate(dados))} noValidate>
            <CardContent className="space-y-4">
              {mensagem && (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>{mensagem}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoFocus
                        inputMode="numeric"
                        autoComplete="username"
                        placeholder="000.000.000-00"
                        // A mascara vive so na exibicao. O que sai no corpo da
                        // requisicao sao os digitos crus, porque o banco guarda
                        // CPF sem mascara (CHECK ck_usuarios_cpf).
                        onChange={(e) => field.onChange(mascararCpf(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        autoComplete="current-password"
                        placeholder="Sua senha"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormDescription className="text-xs">
                As validações desta tela são apenas para agilizar a correção de erros de
                digitação. O servidor valida tudo novamente.
              </FormDescription>
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending && <Loader2 className="animate-spin" aria-hidden />}
                {login.isPending ? 'Entrando...' : 'Entrar'}
              </Button>

              <p className="text-sm text-muted-foreground">
                Não tem conta?{' '}
                <Link to="/cadastro" className="font-medium text-foreground underline">
                  Cadastre-se
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </main>
  )
}
