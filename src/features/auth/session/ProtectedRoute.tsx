import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from './useSession'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session } = useSession()

  if (session.status === 'unknown') {
    return <p>Cargando…</p>
  }

  if (session.status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return children
}
