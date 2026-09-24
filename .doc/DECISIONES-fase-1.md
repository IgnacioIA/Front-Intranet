# DECISIONES — Fase 1 (Base arquitectónica y cliente HTTP)

**Fecha:** 2026-09-20
**Alcance:** decisiones tomadas durante la implementación de la base arquitectónica, antes de introducir `features/auth/` (Fase 2).

## DECIDIDO

- **`credentials: 'include'` en el cliente HTTP base**, aunque en esta fase no se realiza ningún request real. Se incluye ahora porque es una opción de transporte (no lógica de autenticación) requerida por `SPEC-AUTH-002`/`SPEC-AUTH-003` para que la cookie de Refresh Token viaje en Fase 2, sin tener que modificar `httpClient.ts` cuando eso ocurra.
- **`src/shared/http/env.ts` falla rápido (fail-fast)** si `VITE_API_BASE_URL` no está definida, en lugar de asumir un valor por defecto. Coherente con el mismo criterio de fail-fast ya usado por el backend (`SPEC-AUTH-009 RN-07`).
- **`ApiProblemDetails` (`src/types/http.ts`) solo declara `type` como campo requerido**; `title`, `status`, `detail`, `instance` quedan opcionales porque ningún contrato muestra un cuerpo JSON de error completo (ver GAP-10 en `RELEVAMIENTO-frontend-v1.md`). No se inventó la forma del error.
- **`httpClient.ts` no incluye `Authorization`, retry ni refresh.** Estos mecanismos se agregarán en Fase 2 envolviendo `request()`, sin reemplazarlo — la función ya devuelve/lanza lo necesario (`ApiError` con `status` y `problem`) para que un interceptor de 401 se construya por encima sin tocar este archivo.
- **No se creó `src/features/`** todavía (ni siquiera vacía): no hay ningún tipo o lógica que deba vivir ahí en esta fase. Se crea en Fase 2 junto con `features/auth/`.
- **`App.tsx` importa `apiBaseUrl` únicamente para mostrarlo en pantalla** como verificación visual de que la configuración de entorno se cargó correctamente (requisito de validación de esta fase). Es un placeholder temporal, se reemplaza en Fase 2 y no constituye una violación de la regla "los componentes no deben conocer URLs completas" (no arma requests, headers ni interpreta respuestas).

## GAP

- Ninguno nuevo respecto de los ya documentados en `RELEVAMIENTO-frontend-v1.md`. Esta fase no consumió la API real, por lo que no pudo confirmarse ni refutarse ningún GAP existente (p. ej. GAP-04 header `Authorization`, GAP-10 forma exacta de RFC 7807).

## PENDIENTE

- Confirmar contra el backend real, en la fase de integración de laboratorio, la forma exacta del cuerpo de error (GAP-10) antes de que el interceptor de Fase 2 dependa de campos no verificados de `ApiProblemDetails`.
