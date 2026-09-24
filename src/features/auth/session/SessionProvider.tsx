import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { login as loginRequest } from '../api/login'
import { fetchMe } from '../api/me'
import type { LoginRequest } from '../types/auth'
import { SessionContext } from './context'
import type { SessionState } from './context'

// Fase 2: sin refresh no hay chequeo asíncrono al montar, por eso el estado inicial es directamente 'unauthenticated' (ver DECISIONES-fase-2.md); 'unknown' queda modelado para cuando la Fase 3 agregue un intento de refresh silencioso aquí.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>({ status: 'unauthenticated' })
  const accessTokenRef = useRef<string | null>(null)

  async function login(credentials: Omit<LoginRequest, 'provider'>) {
    const { accessToken } = await loginRequest({ provider: 'LOCAL', ...credentials })
    accessTokenRef.current = accessToken
    try {
      const user = await fetchMe(accessToken)
      setSession({ status: 'authenticated', user })
    } catch (error) {
      accessTokenRef.current = null
      setSession({ status: 'unauthenticated' })
      throw error
    }
  }

  function getAccessToken() {
    return accessTokenRef.current
  }

  return (
    <SessionContext.Provider value={{ session, login, getAccessToken }}>
      {children}
    </SessionContext.Provider>
  )
}
