import { request } from '../../../shared/http/httpClient'
import type { CurrentUser } from '../types/auth'

// GAP-04 (RELEVAMIENTO-frontend-v1.md): ningún contrato define el header para enviar el Access Token; se infiere Authorization: Bearer por `tokenType`, sin confirmar contra el backend real.
export function fetchMe(accessToken: string): Promise<CurrentUser> {
  return request<CurrentUser>('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
