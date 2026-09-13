import { cn } from '@/lib/utils'
import type { Role } from '@/tipos'

/**
 * Pecas visuais que se repetem em varias telas.
 *
 * Ficam juntas aqui, e nao em components/ui, porque components/ui e o que o
 * shadcn gera e sobrescreve: misturar codigo do projeto com codigo gerado faz
 * um "shadcn add" futuro apagar o que e nosso.
 */

/** "Ana Souza" -> "AS". Uma letra so quando o nome tem uma palavra. */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 1).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

export function Marca({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span
        className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-[11px] font-bold tracking-tight text-primary-foreground"
        aria-hidden
      >
        UE
      </span>
      <span className="font-semibold">Usuários e Endereços</span>
    </span>
  )
}

export function Avatar({
  nome,
  className,
}: {
  nome: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground',
        className,
      )}
      // O avatar e decorativo: o nome ja esta escrito ao lado em toda tela onde
      // ele aparece. Anuncia-lo de novo seria ruido no leitor de tela.
      aria-hidden
    >
      {iniciais(nome)}
    </span>
  )
}

const PILULA = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap'

export function PerfilBadge({ role, className }: { role: Role; className?: string }) {
  const admin = role === 'ADMIN'
  return (
    <span
      className={cn(
        PILULA,
        admin
          ? 'border-brand-border bg-brand-soft text-brand'
          : 'border-border bg-card text-muted-foreground',
        className,
      )}
    >
      {admin ? 'Administrador' : 'Usuário comum'}
    </span>
  )
}

/**
 * Situacao do endereco. "Secundario" e rotulo de tela, nao conceito do dominio:
 * no banco existe apenas o booleano principal. Nomear o oposto deixa a tabela
 * legivel sem precisar interpretar a ausencia de um selo.
 */
export function SituacaoBadge({ principal }: { principal: boolean }) {
  return (
    <span
      className={cn(
        PILULA,
        principal
          ? 'border-brand-border bg-brand-soft text-brand'
          : 'border-border bg-card text-muted-foreground',
      )}
    >
      {principal ? 'Principal' : 'Secundário'}
    </span>
  )
}

/** CEP em pilula monoespacada, como no desenho das telas. */
export function ChipCep({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-secondary px-2 py-1 font-mono text-xs text-secondary-foreground">
      {children}
    </span>
  )
}

/** Rotulo pequeno + valor. Dado numerico vai em monoespacada. */
export function Dado({
  rotulo,
  mono = false,
  children,
}: {
  rotulo: string
  mono?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className={cn('text-sm font-medium break-words', mono && 'font-mono')}>{children}</dd>
    </div>
  )
}

/**
 * Titulo da pagina com acao a direita, FORA de card.
 *
 * No desenho o titulo respira sobre o fundo e so o conteudo fica em card - o
 * que separa "onde estou" de "o que estou vendo".
 */
export function CabecalhoPagina({
  titulo,
  subtitulo,
  acao,
}: {
  titulo: string
  subtitulo?: React.ReactNode
  acao?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>}
      </div>
      {acao && <div className="flex shrink-0 gap-2">{acao}</div>}
    </div>
  )
}
