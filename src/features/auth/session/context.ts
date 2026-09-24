import { createContext } from 'react'
import type { CurrentUser, LoginRequest } from '../types/auth'

export type SessionState =
  | { status: 'unknown' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: CurrentUser }

export interface SessionContextValue {
  session: SessionState
  login: (credentials: Omit<LoginRequest, 'provider'>) => Promise<void>
  getAccessToken: () => string | null
}

export const SessionContext = createContext<SessionContextValue | undefined>(undefined)
