import type { ApiProblemDetails } from '../../types/http'
import { apiBaseUrl } from './env'
import { ApiError } from './ApiError'

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

function isJsonResponse(response: Response): boolean {
  return (response.headers.get('content-type') ?? '').includes('json')
}

async function parseProblemDetails(response: Response): Promise<ApiProblemDetails | undefined> {
  if (!isJsonResponse(response)) return undefined
  try {
    return (await response.json()) as ApiProblemDetails
  } catch {
    return undefined
  }
}

// Cliente HTTP base: sin Authorization, sin retry ni refresh (eso pertenece a la Fase 2, y se agrega envolviendo esta función, no reemplazándola).
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new ApiError(response.status, await parseProblemDetails(response))
  }

  if (response.status === 204 || !isJsonResponse(response)) {
    return undefined as T
  }

  return (await response.json()) as T
}
