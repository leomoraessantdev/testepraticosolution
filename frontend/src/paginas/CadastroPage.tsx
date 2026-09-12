import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { useCriarUsuario } from '@/api/usuarios'
import { useAuth } from '@/auth/auth-context'
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
import { camposInvalidos, mensagemDeErro } from '@/lib/erros'
import { cpfValido, mascararCpf } from '@/lib/validacao'

/**
 * Validacao de UX. O backend valida tudo de novo - ver lib/validacao.ts.
 *
 * Os campos vem da secao de requisitos do documento: nome, CPF, data de
 * nascimento e senha. O e-mail NAO esta no documento; e exigido pelo backend
 * (@NotBlank @Email, coluna NOT NULL, indice unico uk_usuarios_email) e a
 * decisao de mante-lo esta registrada no PLAN.md.
 */
const schemaCadastro = z.object({
  nome: z.string().trim().min(1, 'Informe o nome').max(150, 'No máximo 150 caracteres'),
  cpf: z.string().min(1, 'Informe o CPF').refine(cpfValido, 'CPF inválido. Confira os números.'),
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  dataNascimento: z
    .string()
    .min(1, 'Informe a data de nascimento')
    // Espelha o @PastOrPresent do backend. Compara como string ISO para nao
    // criar Date e cair em fuso: no formato aaaa-mm-dd a comparacao
    // lexicografica equivale a comparacao cronologica.
    .refine((v) => v <= new Date().toISOString().slice(0, 10), 'A data não pode ser futura'),
  senha: z.string().min(8, 'A senha precisa de ao menos 8 caracteres').max(72, 'No máximo 72'),
})

type FormularioCadastro = z.infer<typeof schemaCadastro>

export function CadastroPage() {
  const { autenticado } = useAuth()
  const navigate = useNavigate()
  const criar = useCriarUsuario()

  const form = useForm<FormularioCadastro>({
    resolver: zodResolver(schemaCadastro),
    defaultValues: { nome: '', cpf: '', email: '', dataNascimento: '', senha: '' },
    mode: 'onBlur',
  })

  if (autenticado) {
    return <Navigate to="/" replace />
  }

  function enviar(dados: FormularioCadastro) {
    criar.mutate(dados, {
      onSuccess: () => {
        toast.success('Cadastro concluído. Entre com seu CPF e senha.')
        navigate('/login', { replace: true })
      },
      onError: (erro) => {
        // O 400 do Bean Validation vem com a lista de campos: marca cada input
        // em vez de mostrar um alerta solto.
        for (const [campo, mensagem] of Object.entries(camposInvalidos(erro))) {
          form.setError(campo as keyof FormularioCadastro, { message: mensagem })
        }
      },
    })
  }

  // 409 e conflito de estado (CPF ou e-mail ja cadastrado), nao erro de campo:
  // o corpo enviado esta correto, entao a mensagem vai para o alerta.
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

              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} autoFocus autoComplete="name" placeholder="Seu nome completo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode="numeric"
                        placeholder="000.000.000-00"
                        onChange={(e) => field.onChange(mascararCpf(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" autoComplete="email" placeholder="voce@exemplo.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataNascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de nascimento</FormLabel>
                    <FormControl>
                      {/* type=date entrega aaaa-mm-dd, exatamente o ISO que o
                          LocalDate do backend desserializa. */}
                      <Input {...field} type="date" max={new Date().toISOString().slice(0, 10)} />
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
                        autoComplete="new-password"
                        placeholder="Ao menos 8 caracteres"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormDescription className="text-xs">
                As validações desta tela servem para agilizar a correção de erros de
                digitação. O servidor valida tudo novamente.
              </FormDescription>
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
