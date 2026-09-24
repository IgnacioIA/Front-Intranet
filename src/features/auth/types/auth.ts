export interface LoginRequest {
  provider: 'LOCAL'
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  expiresInSeconds: number
  tokenType: 'Bearer'
}

export type UserProvider = 'LOCAL' | 'ACTIVE_DIRECTORY'
export type UserStatus = 'PENDING_ONBOARDING' | 'ACTIVE' | 'LOCKED' | 'DISABLED' | 'DEPROVISIONED'

export interface CurrentUser {
  id: string
  provider: UserProvider
  username: string
  displayName: string
  email: string | null
  status: UserStatus
  roles: string[]
  permissions: string[]
}
