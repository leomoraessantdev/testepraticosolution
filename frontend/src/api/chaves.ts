/**
 * Chaves de cache centralizadas.
 *
 * Espalhar array literal pelos componentes e a forma classica de invalidar a
 * chave errada: um ['usuarios'] num lugar e ['usuario'] noutro nao colidem, e o
 * bug aparece como "a tela nao atualizou depois de salvar".
 */
export const chaves = {
  usuarios: ['usuarios'] as const,
  usuario: (id: number) => ['usuario', id] as const,
  enderecos: (usuarioId: number) => ['enderecos', usuarioId] as const,
  enderecosGlobais: (pagina: number) => ['enderecos-globais', pagina] as const,
  cep: (cep: string) => ['cep', cep] as const,
}
