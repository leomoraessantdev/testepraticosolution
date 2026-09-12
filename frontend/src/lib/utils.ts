import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Junta classes condicionais (clsx) e resolve conflitos do Tailwind (twMerge).
 *
 * Sem o twMerge, `cn('p-2', 'p-4')` deixaria as duas classes no HTML e o
 * resultado dependeria da ordem no CSS gerado, nao da ordem no codigo.
 * E o que permite um componente aceitar className de fora e sobrescrever o
 * proprio padrao de forma previsivel.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
