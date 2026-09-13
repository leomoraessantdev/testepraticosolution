import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useConsultarCep } from '@/api/cep'
import { useAtualizarEndereco, useCriarEndereco, type CorpoEndereco } from '@/api/enderecos'
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
import { camposInvalidos, mensagemDeErro, statusDoErro } from '@/lib/erros'
import { cepValido, mascararCep } from '@/lib/validacao'
import type { EnderecoResponse } from '@/tipos'

/** Validacao de UX. O backend valida de novo - ver lib/validacao.ts. */
const schemaEndereco = z.object({
  cep: z.string().min(1, 'Informe o CEP').refine(cepValido, 'O CEP deve ter 8 dígitos'),
  numero: z.string().trim().min(1, 'Informe o número').max(20, 'No máximo 20 caracteres'),
  complemento: z.string().max(100, 'No máximo 100 caracteres'),
  logradouro: z.string().trim().min(1, 'Informe o logradouro').max(255, 'No máximo 255'),
  bairro: z.string().trim().min(1, 'Informe o bairro').max(100, 'No máximo 100'),
  cidade: z.string().trim().min(1, 'Informe a cidade').max(100, 'No máximo 100'),
  uf: z.string().trim().length(2, 'Use a sigla de 2 letras'),
  principal: z.boolean(),
})

type FormularioEndereco = z.infer<typeof schemaEndereco>

const VAZIO: FormularioEndereco = {
  cep: '',
  numero: '',
  complemento: '',
  logradouro: '',
  bairro: '',
  cidade: '',
  uf: '',
  principal: false,
}

type Props = {
  usuarioId: number
  /** Ausente = criar. Presente = editar aquele endereco. */
  endereco?: EnderecoResponse
  aberto: boolean
  onFechar: () => void
}

/**
 * Formulario de endereco, criacao e edicao na mesma tela.
 *
 * O preenchimento automatico dispara no BLUR do CEP, nao a cada tecla: a cada
 * tecla geraria uma requisicao por digito, sendo que so o oitavo produz um CEP
 * consultavel.
 *
 * Os campos trazidos do ViaCEP continuam editaveis (decisao 13 do PLAN.md): o
 * ViaCEP devolve logradouro vazio para CEP de faixa unica, e numero e
 * complemento nunca vem de la.
 */
export function EnderecoFormDialog({ usuarioId, endereco, aberto, onFechar }: Props) {
  const editando = endereco !== undefined

  const consultarCep = useConsultarCep()
  const criar = useCriarEndereco(usuarioId)
  const atualizar = useAtualizarEndereco(usuarioId)
  const salvando = criar.isPending || atualizar.isPending

  const [buscandoCep, setBuscandoCep] = useState(false)

  const form = useForm<FormularioEndereco>({
    resolver: zodResolver(schemaEndereco),
    defaultValues: endereco
      ? {
          cep: mascararCep(endereco.cep),
          numero: endereco.numero,
          complemento: endereco.complemento ?? '',
          logradouro: endereco.logradouro,
          bairro: endereco.bairro,
          cidade: endereco.cidade,
          uf: endereco.uf,
          principal: endereco.principal,
        }
      : VAZIO,
    mode: 'onBlur',
  })

  /** Busca o CEP e preenche o resto. Silencioso quando o CEP e incompleto. */
  async function preencherPeloCep(valor: string) {
    if (!cepValido(valor)) return

    setBuscandoCep(true)
    try {
      const achado = await consultarCep(valor)

      // shouldDirty para o react-hook-form saber que o valor mudou; sem isso a
      // validacao de campo obrigatorio continuaria reclamando de campo cheio.
      form.setValue('logradouro', achado.logradouro, { shouldDirty: true })
      form.setValue('bairro', achado.bairro, { shouldDirty: true })
      form.setValue('cidade', achado.cidade, { shouldDirty: true })
      form.setValue('uf', achado.uf, { shouldDirty: true })
      form.clearErrors(['logradouro', 'bairro', 'cidade', 'uf'])
    } catch (erro) {
      // CEP inexistente nao bloqueia o cadastro: marca o campo e deixa a pessoa
      // digitar o endereco a mao. O backend devolve 404 para o {"erro": true}
      // do ViaCEP e 503 quando o ViaCEP esta fora.
      form.setError('cep', {
        message:
          statusDoErro(erro) === 404
            ? 'CEP não encontrado. Preencha o endereço manualmente.'
            : mensagemDeErro(erro),
      })
    } finally {
      setBuscandoCep(false)
    }
  }

  function enviar(dados: FormularioEndereco) {
    const corpo: CorpoEndereco = {
      ...dados,
      // String vazia vira null: no banco "nao existe" e NULL, nao texto vazio.
      complemento: dados.complemento.trim() === '' ? null : dados.complemento.trim(),
      uf: dados.uf.toUpperCase(),
    }

    const aoFalhar = (erro: unknown) => {
      for (const [campo, mensagem] of Object.entries(camposInvalidos(erro))) {
        form.setError(campo as keyof FormularioEndereco, { message: mensagem })
      }
    }

    if (editando) {
      atualizar.mutate(
        { id: endereco.id, corpo },
        {
          onSuccess: () => {
            toast.success('Endereço atualizado.')
            onFechar()
          },
          onError: aoFalhar,
        },
      )
      return
    }

    criar.mutate(corpo, {
      onSuccess: (criado) => {
        toast.success(
          criado.principal
            ? 'Endereço cadastrado e definido como principal.'
            : 'Endereço cadastrado.',
        )
        onFechar()
      },
      onError: aoFalhar,
    })
  }

  const erro = criar.error ?? atualizar.error
  const temErroDeCampo = erro ? Object.keys(camposInvalidos(erro)).length > 0 : false
  const mensagem = erro && !temErroDeCampo ? mensagemDeErro(erro) : null

  return (
    <Dialog open={aberto} onOpenChange={(estaAberto) => !estaAberto && onFechar()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar endereço' : 'Novo endereço'}</DialogTitle>
          <DialogDescription>
            Informe o CEP para preencher logradouro, bairro, cidade e estado automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(enviar)} noValidate className="space-y-4">
            {mensagem && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{mensagem}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    {/* O wrapper de posicionamento fica FORA do FormControl.
                        FormControl e um Slot: ele injeta id e aria-* no filho
                        direto. Com a div no meio, o id ia para a div e o
                        <label for> do CEP apontava para ela em vez do input -
                        clicar no rotulo nao focava o campo e o leitor de tela
                        nao associava os dois. */}
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          autoFocus
                          inputMode="numeric"
                          placeholder="00000-000"
                          onChange={(e) => field.onChange(mascararCep(e.target.value))}
                          onBlur={(e) => {
                            field.onBlur()
                            void preencherPeloCep(e.target.value)
                          }}
                        />
                      </FormControl>
                      {buscandoCep && (
                        <Loader2
                          className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
                          aria-hidden
                        />
                      )}
                    </div>
                    <FormDescription className="text-xs">
                      {buscandoCep ? 'Consultando CEP...' : 'Sai do campo e o endereço é buscado.'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="complemento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Complemento <span className="text-muted-foreground">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Apartamento, bloco, referência" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logradouro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logradouro</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Preenchido pelo CEP" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="bairro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Preenchido pelo CEP" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Preenchida pelo CEP" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="uf"
                render={({ field }) => (
                  <FormItem>
                    {/* O documento chama de "Estado"; a coluna do banco e uf
                        VARCHAR(2). O rotulo segue o documento. */}
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={2}
                        placeholder="SP"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* A troca de principal e operacao separada, com regra propria
                (rebaixa o anterior). Na edicao nao aparece: o PUT do backend nao
                aceita o campo, e oferecer um controle inerte seria mentira. */}
            {!editando && (
              <FormField
                control={form.control}
                name="principal"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 rounded-md border p-3">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    </FormControl>
                    <div className="space-y-0.5">
                      <FormLabel className="cursor-pointer">Definir como principal</FormLabel>
                      <FormDescription className="text-xs">
                        O endereço principal anterior passa a não ser mais. O primeiro endereço
                        de um usuário vira principal automaticamente.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onFechar} disabled={salvando}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando || buscandoCep}>
                {salvando && <Loader2 className="animate-spin" aria-hidden />}
                {salvando ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
