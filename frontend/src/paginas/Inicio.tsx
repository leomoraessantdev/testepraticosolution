import { Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/auth-context'

/**
 * Raiz da area autenticada. O documento nao pede uma home, entao a rota "/"
 * so encaminha para o lugar util de cada perfil: o admin comeca na listagem de
 * usuarios, o usuario comum vai direto aos proprios dados e enderecos.
 */
export function Inicio() {
  const { sessao, ehAdmin } = useAuth()

  if (ehAdmin) {
    return <Navigate to="/usuarios" replace />
  }
  return <Navigate to={`/usuarios/${sessao?.usuarioId}`} replace />
}
