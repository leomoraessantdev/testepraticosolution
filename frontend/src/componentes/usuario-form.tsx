import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cpfValido, mascararCpf } from '@/lib/validacao'

/**
 * Schema e campos do cadastro de usuario, compartilhados por duas telas: a
 * publica (CadastroPage) e a do administrador (UsuarioFormDialog).
 *
 * Extraido para ca em vez de duplicado porque as regras precisam divergir
 * juntas: se amanha o CPF ganhar outra validacao, nao pode valer num formulario
 * e nao no outro.
 *
 * Validacao de UX. O backend valida tudo de novo - ver lib/validacao.ts.
 *
 * Os campos vem da secao de requisitos do documento: nome, CPF, data de
 * nascimento e senha. Sao exatamente esses quatro: o enunciado nao pede
 * mais nada, e campo a mais em cadastro e atrito a mais para quem se cadastra.
 */
export const schemaUsuario = z.object({
  nome: z.string().trim().min(1, 'Informe o nome').max(150, 'No máximo 150 caracteres'),
  cpf: z.string().min(1, 'Informe o CPF').refine(cpfValido, 'CPF inválido. Confira os números.'),
  dataNascimento: z
    .string()
    .min(1, 'Informe a data de nascimento')
    // Espelha o @PastOrPresent do backend. Compara como string ISO para nao
    // criar Date e cair em fuso: no formato aaaa-mm-dd a comparacao
    // lexicografica equivale a cronologica.
    .refine((v) => v <= new Date().toISOString().slice(0, 10), 'A data não pode ser futura'),
  senha: z.string().min(8, 'A senha precisa de ao menos 8 caracteres').max(72, 'No máximo 72'),
})

export type FormularioUsuario = z.infer<typeof schemaUsuario>

export const VALORES_VAZIOS: FormularioUsuario = {
  nome: '',
  cpf: '',
  dataNascimento: '',
  senha: '',
}

const HOJE = () => new Date().toISOString().slice(0, 10)

export function CamposUsuario({ form }: { form: UseFormReturn<FormularioUsuario> }) {
  return (
    <>
      <FormField
        control={form.control}
        name="nome"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome</FormLabel>
            <FormControl>
              <Input {...field} autoFocus autoComplete="name" placeholder="Nome completo" />
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
                className="font-mono"
                // A mascara vive so na exibicao: o que sai na requisicao sao os
                // digitos crus, porque o banco guarda sem mascara.
                onChange={(e) => field.onChange(mascararCpf(e.target.value))}
              />
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
              {/* type=date entrega aaaa-mm-dd, exatamente o ISO que o LocalDate
                  do backend desserializa. */}
              <Input {...field} type="date" max={HOJE()} />
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
    </>
  )
}
