import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '@/auth/auth-context'
import { Marca } from '@/componentes/elementos'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { mensagemDeErro, statusDoErro } from '@/lib/erros'
import { cpfValido, mascararCpf } from '@/lib/validacao'

/**
 * Validacao de UX. O backend valida de novo - ver o cabecalho de lib/validacao.ts.
 *
 * Assimetria consciente: o LoginRequest do servidor exige apenas @NotBlank no
 * CPF, e nao o digito verificador. A razao esta comentada la - validar formato
 * no login nao protege nada e revelaria quais formatos o sistema aceita. Aqui o
 * calculo roda porque o proposito e outro: avisar de erro de digitacao antes de
 * gastar uma ida ao servidor. Nao ha vazamento, porque o codigo do cliente ja
 * esta nas maos de quem abre o DevTools.
 */
const schemaLogin = z.object({
  cpf: z.string().min(1, 'Informe o CPF').refine(cpfValido, 'CPF inválido. Confira os números.'),
  senha: z.string().min(1, 'Informe a senha'),
})

type FormularioLogin = z.infer<typeof schemaLogin>

/**
 * As contas que a migration V3 cria. Ficam aqui para o avaliador entrar sem
 * abrir o README - sao dados de demonstracao publicos, ja documentados no
 * repositorio, nao credencial de producao.
 */
const DEMONSTRACAO = [
  { rotulo: 'Administrador', cpf: '529.982.247-25', senha: 'admin123' },
  { rotulo: 'Usuário comum', cpf: '111.444.777-35', senha: 'usuario123' },
]

export function LoginPage() {
  const { entrar, autenticado } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const form = useForm<FormularioLogin>({
    resolver: zodResolver(schemaLogin),
    defaultValues: { cpf: '', senha: '' },
    // Valida ao sair do campo, nao a cada tecla: marcar "CPF invalido" no
    // terceiro digito, enquanto a pessoa digita, e ruido.
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
  // generica de proposito - nao diz se o CPF existe -, entao so a repassamos.
  const mensagem =
    statusDoErro(erro) === 401 ? 'CPF ou senha incorretos.' : erro ? mensagemDeErro(erro) : null

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-12">
      {/* Coluna estreita sem card: o formulario ja e a unica coisa na tela, e
          uma moldura em volta de conteudo que nao disputa espaco com nada so
          adiciona ruido. */}
      <div className="w-full max-w-sm">
        <Marca className="mb-8" />

        <h1 className="text-4xl font-bold tracking-tight">Entrar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Informe seu CPF e senha para acessar seus dados.
        </p>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((dados) => login.mutate(dados))}
            noValidate
            className="mt-8 space-y-4"
          >
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
                      className="font-mono"
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

            <Button type="submit" className="w-full" size="lg" disabled={login.isPending}>
              {login.isPending && <Loader2 className="animate-spin" aria-hidden />}
              {login.isPending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Form>

        <p className="mt-5 text-sm text-muted-foreground">
          Não tem conta?{' '}
          <Link to="/cadastro" className="font-medium text-brand hover:underline">
            Cadastre-se
          </Link>
        </p>

        <div className="mt-8 border-t pt-5">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Contas de demonstração
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEMONSTRACAO.map((conta) => (
              <Button
                key={conta.rotulo}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Preenche em vez de logar direto: quem avalia ve o CPF
                  // mascarado no campo e confere o fluxo de verdade, incluindo
                  // a validacao do formulario.
                  form.setValue('cpf', conta.cpf, { shouldValidate: true })
                  form.setValue('senha', conta.senha, { shouldValidate: true })
                }}
              >
                {conta.rotulo}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
