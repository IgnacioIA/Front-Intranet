import type { ApiProblemDetails } from '../../types/http'

export class ApiError extends Error {
  readonly status: number
  readonly problem?: ApiProblemDetails

  constructor(status: number, problem?: ApiProblemDetails) {
    super(problem?.type ?? `Error HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}
