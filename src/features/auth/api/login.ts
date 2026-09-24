import { request } from '../../../shared/http/httpClient'
import type { LoginRequest, LoginResponse } from '../types/auth'

export function login(credentials: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: credentials,
  })
}
