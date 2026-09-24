// GAP-10 (RELEVAMIENTO-frontend-v1.md): solo `type` está confirmado por los contratos; el resto son campos estándar de RFC 7807 sin ejemplo documentado.
export interface ApiProblemDetails {
  type: string
  title?: string
  status?: number
  detail?: string
  instance?: string
}
