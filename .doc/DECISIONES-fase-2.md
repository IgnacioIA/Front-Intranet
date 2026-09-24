# DECISIONES — Fase 2 (Autenticación, sesión y `/auth/me`)

**Fecha:** 2026-09-20
**Alcance:** login, estado de sesión, `/auth/me`, ruta protegida. Sin refresh, sin logout (ver regla principal de la fase).

## DECIDIDO

- **Estado de sesión como unión discriminada** (`{status:'unknown'}` / `{status:'unauthenticated'}` / `{status:'authenticated', user}`) en `features/auth/session/context.ts`, para no caer en la ambigüedad de `user === null`. Implementado con React Context + un hook (`useSession`), sin gestor de estado externo.
- **El Access Token vive solo en memoria**, en un `useRef` dentro de `SessionProvider` (no `useState`, porque no debe disparar renders por sí mismo). Se expone mediante `getAccessToken()` en el contexto como punto de extensión para la Fase 3 (adjuntar `Authorization` a futuras llamadas, refresh), aunque en esta fase solo lo consume internamente el propio `login()`.
- **`/auth/me` es la fuente de verdad de la identidad**, tal como exige `SPEC-AUTH-005 RN-01`: el flujo de login siempre encadena `POST /auth/login → GET /auth/me`, y el estado solo pasa a `authenticated` cuando ambas llamadas resuelven. Si `/auth/me` falla después de un login exitoso, se descarta el token y se vuelve a `unauthenticated` (no se deja un estado a medio camino).
- **`provider` fijo en `'LOCAL'`** para todo el flujo de V1 (confirma la recomendación PENDIENTE-01 del relevamiento). El formulario de login no expone selector de proveedor; `LoginRequest.provider` está tipado como el literal `'LOCAL'`, no como la unión completa del contrato.
- **Estado inicial de sesión: `unauthenticated` directo**, no `unknown` seguido de un efecto. En esta fase no existe ningún chequeo asíncrono al montar la app (no hay refresh), así que no hay nada que "comprobar" — inicializar en un efecto solo para asignar un valor síncrono generaba un render en cascada innecesario (lo señaló oxlint: regla `react(set-state-in-effect)`). El tipo `SessionState` conserva `'unknown'` porque es el modelo correcto a futuro: la Fase 3, al agregar el intento de refresh silencioso al montar, es la que efectivamente empezará en `'unknown'` y lo resolverá de forma asíncrona.
- **Comportamiento ante recarga del navegador (F5): esperado y documentado.** El token vive en un `useRef` de un componente React; al recargar, el árbol de componentes se destruye y se pierde. El usuario vuelve a `unauthenticated` y ve `/login`. No se usó `localStorage`/`sessionStorage` para evitar esto, tal como pide la consigna — es un comportamiento intencional de esta fase, no un bug.
- **Manejo de errores reutiliza `ApiError`/`ApiProblemDetails` de Fase 1**, sin un sistema paralelo. En `LoginPage`, `error.status` distingue 401 (credenciales inválidas) de 429 (límite de intentos) de cualquier otro caso (mensaje genérico). Un 401 en `/auth/me` (fuera del flujo de login) se trataría igual que cualquier fallo de la cadena login→me: se descarta el token y se vuelve a `unauthenticated`, sin ningún intento de recuperación (el refresh es explícitamente de la Fase 3).
- **Rutas:** `/login` (pública) y `/` (protegida vía `ProtectedRoute`, que lee `session.status`). Un usuario ya autenticado que visita `/login` es redirigido a `/`; uno no autenticado que visita `/` es redirigido a `/login`. No se crearon `/admin`, `/users`, etc.
- **`App.tsx` deja de ser el placeholder de Fase 1** y ahora muestra la identidad real devuelta por `/auth/me` (username, displayName, provider, status, roles, permissions) — únicamente campos confirmados por `SPEC-AUTH-005`, ninguno inventado.

## GAP

- **GAP-04 sigue abierto** (ya documentado en `RELEVAMIENTO-frontend-v1.md`): ningún contrato especifica el header para enviar el Access Token en una request protegida. Se implementó `Authorization: Bearer <token>` en `features/auth/api/me.ts` porque es la única forma de completar `/auth/me` en absoluto, y es la inferencia estándar dado `tokenType: "Bearer"` — pero **sigue sin confirmación contractual**. Queda marcado en el código (comentario en `me.ts`) y aquí. No se convirtió esta inferencia en un hecho `DECIDIDO`.
- No se descubrieron GAPs nuevos durante esta fase.

## PENDIENTE

- **Confirmar GAP-04 contra el backend real.** No fue posible en este entorno de desarrollo: no hay acceso de red a la API de Laucom ni al laboratorio (Windows Server 2022) desde esta sesión. Ver la sección de pruebas del informe de cierre para el detalle de lo que sí pudo verificarse (build, lint, resolución de módulos) y lo que no (ejecución interactiva del formulario en un navegador real, y la prueba de extremo a extremo contra la API real: CORS, cookies, preflight).
- Cuando exista acceso de laboratorio, ejecutar los 6 casos de la Fase 2 (login válido, credenciales inválidas, `/auth/me` sin sesión, ruta protegida sin sesión, ruta protegida autenticado, contenido de la identidad) contra el backend real antes de dar la fase por validada funcionalmente, no solo estructuralmente.
