# RELEVAMIENTO — Frontend V1 Laucom

**Estado:** PROPUESTA — pendiente de revisión y aprobación
**Fecha:** 2026-09-20
**Alcance de esta tarea:** análisis y diseño exclusivamente. No se modificó código, no se instalaron dependencias, no se crearon componentes, no se modificaron los contratos.

**Fuente analizada:** `.doc/api-contracts/SPEC-AUTH-001` a `SPEC-AUTH-010` (10 documentos, todos `Estado: APPROVED`).

---

## A. Resumen de los contratos encontrados

| SPEC | Módulo | Relevante para el Frontend |
|---|---|---|
| AUTH-001 | Autenticación (login LOCAL/AD, aprovisionamiento AD) | Sí — `POST /auth/login` |
| AUTH-002 | Renovación de sesión (refresh, rotación, reuse) | Sí — `POST /auth/refresh` |
| AUTH-003 | Cierre de sesión (logout, logout-all) | Sí — `POST /auth/logout`, `POST /auth/logout/all` |
| AUTH-004 | Revocación administrativa de sesiones | Parcial — endpoint admin, no es flujo de usuario final |
| AUTH-005 | Identidad actual | Sí — `GET /auth/me` |
| AUTH-006 | Autorización (mecanismo transversal, RBAC+Permissions) | Sí, mecánicamente — sin endpoint propio |
| AUTH-007 | Gestión de contraseña LOCAL (cambio/recuperación) | Fuera del flujo mínimo descripto en la consigna |
| AUTH-008 | Administración mapping AD Group → Role | No — módulo administrativo futuro |
| AUTH-009 | Bootstrap del Master Admin | No — proceso interno de arranque del backend, sin endpoint HTTP |
| AUTH-010 | Administración de Usuarios, Roles y Permissions | Parcial — un endpoint de lectura (`GET /auth/admin/users`) se reutiliza como "recurso protegido" de demostración; el resto es un módulo administrativo futuro |

**Total de endpoints HTTP documentados:** 26 (contando cada verbo+ruta), repartidos en 8 SPECs (AUTH-006 y AUTH-009 no exponen HTTP).

---

## B. Frontend V1 mínimo

### Necesario para V1

| Endpoint | Justificación |
|---|---|
| `POST /auth/login` | Punto de entrada obligatorio del flujo pedido en la consigna. |
| `GET /auth/me` | Requerido explícitamente: mostrar identidad, roles y permisos. |
| `POST /auth/refresh` | Requerido explícitamente: continuar sesión tras expiración del Access Token. |
| `POST /auth/logout` | Requerido explícitamente: cierre de sesión. |
| `POST /auth/logout/all` | Contrato disponible (`SPEC-AUTH-003`) y pedido explícitamente ("si está disponible en los contratos, incluir una acción mínima"). |
| `GET /auth/admin/users` | **Reutilizado como "recurso protegido" de demostración** (ver GAP-06 más abajo — no existe en los contratos ningún recurso protegido "de negocio" ajeno al módulo de administración; este es de solo lectura y de menor riesgo que cualquier endpoint mutador). Permite demostrar 401 (sin token) y 403 (sin `USER_READ`). |

### Útil para V1 pero no imprescindible

| Endpoint | Justificación |
|---|---|
| `POST /auth/admin/users/{userId}/revoke-sessions` | Permite demostrar en laboratorio la revocación administrativa y su efecto sobre el propio frontend (el usuario revocado deja de poder refrescar). No es parte del flujo de autoservicio pedido; requiere un segundo actor administrador y `SESSION_REVOKE_ANY`. |
| `POST /auth/password/change` | Contrato completo y sencillo (2 campos), pero no mencionado en el flujo mínimo de la consigna (sección 3). Se deja disponible para una iteración inmediatamente posterior a V1 si se desea, no bloquea el objetivo actual. |

### Fuera de alcance V1

| Endpoint / SPEC | Justificación |
|---|---|
| `POST /auth/password/recovery/request` / `.../confirm` | Depende de infraestructura de envío de correo, fuera del alcance de esta etapa y no mencionado como necesario en la consigna. |
| `SPEC-AUTH-008` — mapping AD Group→Role (CRUD completo) | Módulo administrativo de un dominio distinto (gestión de AD), pertenece a una futura pantalla de administración, no al flujo de autenticación/sesión. |
| `SPEC-AUTH-009` — Bootstrap Master Admin | No tiene contrato HTTP; es un proceso de arranque del backend. No aplica al frontend en absoluto. |
| `SPEC-AUTH-010` — resto de endpoints (CRUD de usuarios LOCAL, Roles, Permissions, asignación/revocación de roles) | Pertenecen al futuro módulo de administración de usuarios/roles/permisos. Se usa únicamente `GET /auth/admin/users` como recurso protegido de prueba (ver arriba); el resto (crear usuario, gestionar roles, asignar/revocar) queda fuera de V1. |
| `SPEC-AUTH-004` como pantalla de autoservicio | Es una capacidad administrativa sobre *otro* usuario, no autoservicio; se incluye solo como "útil" para pruebas de laboratorio, no como pantalla necesaria de V1. |

---

## C. Flujo de autenticación (adaptado a los contratos reales)

```text
Frontend
   │
   ▼
POST /auth/login  { provider: "LOCAL", username, password }
   │
   ├─ 401 invalid-credentials  → mostrar error genérico (no distingue causa, RN-06)
   ├─ 429 rate-limit-exceeded  → mostrar "demasiados intentos"
   ├─ 503 ad-unavailable / ad-sync-failed → solo si provider=ACTIVE_DIRECTORY
   │
   ▼ 200 OK
{ accessToken, expiresInSeconds, tokenType: "Bearer" }
   + Set-Cookie refresh token (HttpOnly, Secure, SameSite, Path=/auth) — invisible para JS
   │
   ▼
Guardar accessToken en memoria (NUNCA en localStorage — no hay contrato que lo permita/requiera,
y persistirlo fuera de memoria es una decisión de seguridad, no un requisito de la API)
   │
   ▼
GET /auth/me  (Authorization: Bearer <accessToken> — ver GAP-04)
   │
   ├─ 401 invalid-access-token → no debería ocurrir inmediatamente tras login; tratar como sesión rota
   ▼ 200 OK
{ id, provider, username, displayName, email, status, roles[], permissions[] }
   │
   ▼
Mostrar identidad / roles / permisos. Habilitar navegación según permisos (solo UI, no seguridad real).
   │
   ▼
Consumir recurso protegido (GET /auth/admin/users)
   │
   ├─ 401 → Access Token ausente/expirado/inválido
   │     │
   │     ▼
   │  POST /auth/refresh  (cookie viaja sola, sin body)
   │     │
   │     ├─ 401 invalid-refresh-token / refresh-token-reused
   │     │     → limpiar sesión, redirigir a login (el cliente NO distingue expiración de reuso, es intencional)
   │     ▼ 200 OK
   │  { accessToken nuevo, ... } + Set-Cookie refresh rotado
   │     │
   │     ▼
   │  Reintentar UNA sola vez la request original con el nuevo Access Token
   │
   └─ 403 → usuario autenticado pero sin el permiso (`USER_READ`) → pantalla "Acceso denegado"
         (el backend es la autoridad; el frontend no debe haber ocultado la acción como medida de seguridad)
   │
   ▼
POST /auth/logout        → revoca la familia actual, éxito idempotente
POST /auth/logout/all    → revoca todas las familias del usuario en todos los dispositivos
```

---

## D. Matriz de endpoints

| Endpoint | Método | Propósito | Autenticación | Autorización | Uso en V1 |
|---|---|---|---|---|---|
| `/auth/login` | POST | Emitir Access+Refresh Token | Ninguna | Ninguna | **Necesario** |
| `/auth/refresh` | POST | Rotar Refresh Token, emitir nuevo Access Token | Refresh Token (cookie) | Ninguna (la validez del token es la autorización) | **Necesario** |
| `/auth/logout` | POST | Revocar la sesión actual | Refresh Token (cookie), idempotente | Ninguna | **Necesario** |
| `/auth/logout/all` | POST | Revocar todas las sesiones del usuario | Refresh Token (cookie), idempotente | Ninguna | **Necesario** |
| `/auth/me` | GET | Identidad, estado, roles, permisos vigentes | Access Token | Ninguna (solo estar autenticado) | **Necesario** |
| `/auth/admin/users/{userId}/revoke-sessions` | POST | Revocación administrativa de sesiones de un tercero | Access Token | `SESSION_REVOKE_ANY` | Útil (laboratorio) |
| `/auth/password/change` | POST | Cambiar contraseña propia (solo LOCAL) | Access Token | Ninguna (sobre la propia cuenta) | Útil, no imprescindible |
| `/auth/password/recovery/request` | POST | Solicitar recuperación por email | Ninguna | Ninguna | Fuera de alcance |
| `/auth/password/recovery/confirm` | POST | Confirmar nueva contraseña con token | Ninguna (el token es la credencial) | Ninguna | Fuera de alcance |
| `/auth/admin/ad-group-mappings` (GET/POST/PUT/DELETE) | — | CRUD mapping AD Group→Role | Access Token | `AD_MAPPING_MANAGE` | Fuera de alcance |
| `/auth/admin/users` (GET) | GET | Listado paginado de usuarios | Access Token | `USER_READ` | **Necesario** (como recurso protegido de demo) |
| `/auth/admin/users/{userId}` (GET/PATCH) | — | Detalle/edición usuario LOCAL | Access Token | `USER_READ`/`USER_MANAGE` | Fuera de alcance |
| `/auth/admin/users/{userId}/{enable,disable,lock,unlock,deprovision}` | POST | Cambios de estado administrativo | Access Token | `USER_MANAGE` | Fuera de alcance |
| `/auth/admin/roles`, `/auth/admin/permissions` (CRUD) | — | Catálogo de Roles/Permissions | Access Token | `ROLE_*`/`PERMISSION_*` | Fuera de alcance |
| `/auth/admin/users/{userId}/roles` (GET/POST/DELETE) | — | Asignación/revocación explícita de Role | Access Token | `USER_READ`/`ROLE_ASSIGN`/`ROLE_REVOKE` | Fuera de alcance (se opera desde backend/lab, no desde V1) |

---

## E. Matriz de errores (comportamiento frontend)

| HTTP | Situación (según contratos) | Comportamiento esperado en V1 |
|---|---|---|
| 200 | Operación exitosa | Procesar respuesta normalmente |
| 202 | Solicitud de recuperación de password aceptada (fuera de alcance V1) | N/A en V1 |
| 400 | `provider` inválido/ausente en login; operación restringida a LOCAL sobre usuario AD; transición de estado inválida; rol inactivo | Mostrar el error puntual del endpoint (no genérico) |
| 401 | Login: credenciales inválidas o cuenta LOCKED/DISABLED (mensaje único, no distinguible — RN-06). `/auth/me` y recurso protegido: Access Token ausente/expirado/inválido → **intentar refresh una vez, luego reintentar la request original; si el refresh también falla, limpiar sesión y redirigir a login**. `/auth/refresh`: token ausente/expirado/revocado/reutilizado/cuenta no ACTIVE → limpiar sesión y redirigir a login (sin intentar distinguir causa, es intencional del contrato) | Ver flujo en sección C |
| 403 | Autenticado pero sin el permiso requerido (`AUTHORIZATION_DENIED`) | Mostrar pantalla "Acceso denegado"; **no** reintentar refresh (403 no es un problema de token, es de permisos) |
| 404 | Recurso/usuario/rol/permiso inexistente (rutas admin) | Fuera del flujo V1 salvo que se navegue a un detalle inexistente |
| 409 | Conflictos administrativos (username duplicado, continuidad de MASTER_ADMIN, revocar asignación no explícita, grupo ya mapeado) | Fuera del flujo V1 |
| 422 | Nueva contraseña no cumple política | Fuera del flujo V1 (pertenece a `/auth/password/*`) |
| 429 | Límite de intentos de login excedido | Mostrar "demasiados intentos, reintente más tarde" |
| 500 | Error interno (no documentado explícitamente en ninguna SPEC, pero implícito como catch-all) | Mostrar error genérico — **GAP-09**: ninguna SPEC define 500 explícitamente; se asume el comportamiento estándar de servidor de aplicaciones |
| 503 | AD inalcanzable (`ad-unavailable`) o falla de sincronización de grupos (`ad-sync-failed`) — solo login con `provider=ACTIVE_DIRECTORY` | Mostrar "servicio de autenticación no disponible", distinto del error de credenciales |

**Nota importante (GAP-08):** ninguna SPEC asigna explícitamente un código HTTP al caso "usuario con `status != ACTIVE` pero Access Token criptográficamente aún vigente" para un endpoint protegido genérico (`SPEC-AUTH-006`, escenario "Cuenta no activa con token criptográficamente válido", y `SPEC-AUTH-010`, escenario "Usuario deshabilitado no puede acceder" — ambos dicen "se deniega" sin especificar 401 o 403). Es razonable que sea 403 (la falta de permisos efectivos, ya que sin `ACTIVE` no hay permisos vigentes), pero el frontend **no debe asumirlo como decidido**: debe tratarlo igual que cualquier 403 (mostrar acceso denegado, sin reintentar refresh) y esto debe confirmarse en el laboratorio de integración.

---

## F. Contrato de sesión — hallazgos y GAPs

### Hechos documentados (DECIDIDO)

- El Access Token se entrega en el **cuerpo** de la respuesta de `/auth/login` y `/auth/refresh`: `{ accessToken, expiresInSeconds, tokenType: "Bearer" }`.
- `expiresInSeconds` es explícitamente **900** (15 minutos) en los ejemplos, y el texto de `SPEC-AUTH-003`/`SPEC-AUTH-004` confirma "ventana corta (máximo 15 minutos)" para el Access Token.
- El Refresh Token viaja **exclusivamente por cookie** `Set-Cookie`, con atributos `HttpOnly`, `Secure`, `SameSite` y `Path=/auth` (corregido desde `/auth/refresh` según Decision Ledger 2026-09-06, Fase 22, precisamente para que `/auth/logout` y `/auth/logout/all` puedan recibirla).
- El Refresh Token **nunca** viaja en el cuerpo de ninguna request ni response; el frontend no necesita (ni puede) leerlo.
- La rotación es estricta, sin grace period (`ADR-008`): el frontend **debe serializar ("single-flight")** sus llamadas de refresh — es un requisito explícito del contrato (`RN-05, SPEC-AUTH-002`), no una opción de diseño.
- Reutilizar un Refresh Token ya revocado revoca **toda la familia** inmediatamente (`RN-04`).
- Logout y logout-all no invalidan el Access Token ya emitido; expira naturalmente.
- `/auth/refresh` y `/auth/logout*` no requieren Access Token, solo la cookie de Refresh Token.

### GAPs (información no especificada en los contratos)

- **GAP-01 — Nombre de la cookie de Refresh Token:** ninguna SPEC indica el nombre concreto de la cookie (`refresh_token`, `rt`, u otro). Es indiferente para el frontend (no debe leerla), pero es necesario conocerlo para verificar su presencia/atributos en DevTools durante el laboratorio de integración.
- **GAP-02 — Valor de `SameSite`:** se menciona el atributo pero no su valor (`Strict`, `Lax` o `None`). Esto es crítico si el frontend y el backend terminan en orígenes distintos en el laboratorio (VM cliente vs. Windows Server 2022) — `SameSite=Strict` podría bloquear el envío de la cookie en escenarios cross-site. **Debe verificarse en integración**, no puede inferirse.
- **GAP-03 — Duración del Refresh Token:** no se especifica en ninguna SPEC (a diferencia del Access Token, que sí tiene `expiresInSeconds` explícito).
- **GAP-04 — Mecanismo de envío del Access Token en requests protegidas:** ninguna SPEC incluye una tabla de "Headers" con `Authorization: Bearer <token>` de forma explícita (p. ej. `SPEC-AUTH-005 §12` no tiene sección de Headers). Se infiere razonablemente por convención estándar y por el campo `tokenType: "Bearer"` en la respuesta de login/refresh, pero **es una inferencia, no un hecho documentado**. Debe confirmarse en el primer request real contra el backend.
- **GAP-05 — Mecanismo exacto de "eliminar la cookie" en logout:** `SPEC-AUTH-003` dice "el sistema instruye al cliente a eliminar la cookie", sin detallar si es vía `Set-Cookie` con `Max-Age=0`/fecha pasada u otro mecanismo. Sin impacto funcional para el frontend (no debe manipular la cookie de todos modos), pero relevante para verificar en DevTools.
- **GAP-06 — Ausencia de un "recurso protegido" de negocio genérico:** los 10 contratos relevados no incluyen ningún endpoint protegido que no sea administrativo. Para demostrar 401/403 sobre "un recurso protegido" (pedido explícitamente en la consigna), V1 debe reutilizar `GET /auth/admin/users`, una decisión pragmática, no un hallazgo de los contratos.
- **GAP-07 — `mustChangeOnNextLogin` no se expone al frontend en ningún contrato de autenticación:** esta bandera existe en el dominio (`SPEC-AUTH-009`, `SPEC-AUTH-010` UC-AUTH-016) pero **no aparece ni en la respuesta de `/auth/login` ni en `/auth/me`**. El frontend no tiene forma contractual de saber que un usuario debe cambiar su contraseña obligatoriamente. **Por esta razón, forzar una pantalla de "cambio de contraseña obligatorio" queda fuera de alcance de V1** — no es una omisión de diseño, es una limitación real del contrato actual tal como está documentado.
- **GAP-08:** ver nota al pie de la sección E (código HTTP para cuenta no-ACTIVE con token aún válido, en endpoints protegidos genéricos).
- **GAP-09:** ninguna SPEC define explícitamente el comportamiento ante 500 (error interno); se asume el estándar (mostrar error genérico) sin contrato que lo respalde línea por línea.
- **GAP-10 — Forma exacta del cuerpo de error RFC 7807:** todas las SPECs mencionan "RFC 7807" y listan el campo `type`, pero ninguna muestra un ejemplo JSON completo del cuerpo de error (¿incluye `title`, `status`, `detail`, `instance`?). Necesario definirlo antes de programar el parser de errores del cliente HTTP — **PENDIENTE de confirmar contra una respuesta real del backend**, ya que no puede inventarse la forma.

### PENDIENTE (requiere decisión, no información faltante del contrato)

- **PENDIENTE-01:** decidir si V1 usa exclusivamente `provider=LOCAL` para el demo (más simple, no depende de AD) o si también contempla `ACTIVE_DIRECTORY` (agrega el manejo de 503 distinguible). La consigna menciona "Login LOCAL" como el caso a validar; se recomienda **LOCAL únicamente para V1**, dejando el selector de proveedor como campo oculto/fijo, no como decisión de UI todavía.
- **PENDIENTE-02:** decidir si el usuario de prueba para demostrar 403 se gestiona manualmente en el laboratorio (vía backend/DB/admin) o si se requiere una pantalla mínima de asignación de roles dentro de V1. Se recomienda **gestión manual en laboratorio** — el CRUD de roles pertenece a un módulo fuera de alcance (ver sección B).

---

## G. Validables durante el desarrollo frontend vs. requieren integración real

### Validables durante el desarrollo (sin backend real, ni mocks que oculten problemas de integración)

- Routing y guardas de ruta (autenticado / no autenticado).
- Estados de UI: cargando, error, sesión expirada, acceso denegado.
- Renderizado condicional de navegación según `roles`/`permissions` recibidos (con datos de ejemplo del propio contrato, no inventados).
- Lógica pura de sesión: almacenamiento en memoria del Access Token, expiración por tiempo, disparo del refresh.
- Lógica de single-flight del refresh (múltiples llamadas concurrentes deben colapsar en una sola request real) — testeable con Vitest sin red real.
- Manejo de la respuesta de error (parseo de RFC 7807, una vez confirmada su forma real — ver GAP-10).

### Requieren integración con la API real (backend desplegado, laboratorio Windows Server 2022 + MySQL + AD)

- CORS (orígenes distintos entre VM cliente y servidor).
- Cookies: presencia, `HttpOnly`, `Secure`, `SameSite` real (GAP-02), `Path`.
- `credentials: 'include'` en las requests — sin esto, la cookie de Refresh Token no viajará nunca, y esto solo se observa contra el servidor real.
- Preflight `OPTIONS` (si `Content-Type: application/json` + credenciales dispara preflight, como es lo usual).
- El header `Authorization` real (confirmar GAP-04).
- JWT real, expiración real de 900s, refresh real, rotación real.
- Reuso de Refresh Token: **sí es validable desde el navegador**, mediante dos pestañas (o dos requests deliberadamente no serializadas) contra el Refresh Token vigente — es el propio caso límite documentado en `SPEC-AUTH-002 §7` ("dos pestañas, un reintento de red"). Lo que **no** es validable desde el navegador es la confirmación en base de datos de que la familia completa quedó revocada, ni la existencia del evento de auditoría `TOKEN_REUSE_DETECTED` — eso requiere consulta directa a MySQL o a un endpoint de auditoría, que **no existe** en los 10 contratos relevados.
- Revocación administrativa real y su efecto observable en el frontend (siguiente refresh del usuario revocado falla).
- Integración AD (login AD, sincronización de roles, 503 por AD caído).
- Persistencia de sesión ante reinicio del backend o reinicio del navegador (recarga de página → ¿hay que reintentar `/auth/refresh` silenciosamente al montar la app? — comportamiento recomendado, no exigido explícitamente por ningún contrato, pero es la única forma razonable de sostener sesión entre recargas dado que el Access Token vive solo en memoria).

**No se crearán mocks para reemplazar ninguno de los puntos de la segunda lista** — se marcan explícitamente como "requiere laboratorio" en el plan de trabajo.

---

## H. Arquitectura inicial propuesta

```text
src/
├── app/
│   ├── App.tsx              # composición raíz: providers + router
│   └── router.tsx           # definición de rutas y guardas (protegida / pública)
├── features/
│   └── auth/
│       ├── api/              # login(), me(), refresh(), logout(), logoutAll()
│       │                     # — un archivo por contrato, tipado 1:1 con la SPEC correspondiente
│       ├── session/           # estado de sesión (Context), hidratación al montar la app
│       │                     # single-flight de refresh, interceptor 401
│       ├── components/        # LoginForm, ProtectedRoute, AccessDenied, IdentityPanel
│       └── types.ts           # tipos que reflejan EXACTAMENTE los campos documentados
│                             # (nunca campos inventados — ver Restricción #6 de la consigna)
├── shared/
│   └── http/
│       ├── client.ts          # wrapper de fetch: credentials:'include', base URL, JSON
│       └── problemDetails.ts  # parseo de error RFC 7807 (una vez confirmada su forma, GAP-10)
└── types/
    └── http.ts                # tipos genéricos (ProblemDetail, etc.), no específicos de auth
```

**Justificación de lo que NO se incluye todavía:**
- No hay `services/` como capa separada de `features/*/api/`: con una sola feature (`auth`), separar "api" de "services" sería una abstracción sin consumidor. Si en V2 aparecen `features/users`, `features/roles`, cada una repite el mismo patrón `api/` interno — la carpeta se generaliza por repetición real, no por anticipación.
- `shared/http` contiene solo transporte genérico (fetch + parseo de errores), nunca conocimiento de endpoints — así protege la regla de la consigna de que la API es la fuente de verdad y el frontend no la reinterpreta.
- No hay carpeta `store/` ni gestor de estado global de terceros: el único estado transversal de V1 es la sesión, y vive en `features/auth/session/`.

**Preparación para crecimiento futuro** (sin construirlo ahora): la estructura admite agregar `features/users/`, `features/roles/`, `features/permissions/`, `features/sessions/` (para `SPEC-AUTH-004` como pantalla de administración) y `features/audit/` sin tocar `app/` ni `shared/http/`.

---

## I. Dependencias propuestas

| Dependencia | Problema que resuelve | ¿Por qué ahora? | Alternativa considerada | Impacto arquitectónico |
|---|---|---|---|---|
| **react-router** (única dependencia nueva recomendada para V1) | Rutas direccionables (login, dashboard, acceso-denegado) y guarda de ruta protegida idiomática | El flujo mínimo ya tiene ≥3 pantallas con navegación entre estados de autenticación; alternar vistas a mano con estado local deja de ser idiomático a partir de la 2ª pantalla protegida | Renderizado condicional manual sin router — descartado: no escala ni siquiera dentro de V1 (login / dashboard / acceso-denegado ya son 3 estados) | Bajo: solo define `app/router.tsx` y envuelve `ProtectedRoute` |
| Fetch nativo (sin librería HTTP) | Llamadas a los 6 endpoints de V1 | El volumen y la complejidad (una sola cabecera `Authorization`, una cookie manejada por el navegador) no justifican axios/ky; el único comportamiento no trivial (single-flight de refresh) se implementa en ~30-50 líneas propias, y esa lógica es específica del contrato de `SPEC-AUTH-002 RN-05`, no algo que una librería genérica resuelva mejor | axios, ky | Ninguno (no se agrega dependencia) |
| Sin gestor de estado global (Redux/Zustand/Jotai) | — | El único estado compartido es la sesión; `Context` + `useReducer` de React alcanza | Zustand (más liviano que Redux) — descartado por ahora, no hay problema que resuelva todavía | Ninguno |
| Sin TanStack Query / SWR | — | V1 tiene 2 llamadas de lectura (`/auth/me`, recurso protegido), sin necesidad de invalidación cruzada ni caché compartida entre pantallas | Se reconsiderará cuando el módulo de administración (V2+) tenga múltiples listados con paginación/filtros reales (`SPEC-AUTH-010`) | Ninguno |
| Sin librería de formularios (react-hook-form) | — | El login tiene 2 campos; controlado a mano es suficiente | Se reconsiderará para formularios de administración (crear usuario, editar rol) | Ninguno |
| Sin librería de validación (zod/yup) | — | No hay reglas de validación complejas en V1; la única regla de negocio real (política de contraseña, mínimo 12 caracteres) pertenece a `/auth/password/change`, fuera de alcance V1 | Se reconsiderará si `/auth/password/change` entra en una iteración siguiente | Ninguno |
| Vitest + React Testing Library (dev, no bloqueante para el relevamiento) | Testear la lógica pura de sesión (single-flight, expiración, guardas) sin depender del laboratorio | Recomendado para la fase de implementación, no para esta etapa de análisis | — | Solo devDependencies |

No se propone ninguna dependencia "porque es popular"; cada una fuera de `react-router` queda explícitamente diferida con su condición de reconsideración.

---

## Resumen: DECIDIDO / GAP / PENDIENTE

### DECIDIDO (respaldado directamente por los contratos)
- Access Token en cuerpo de respuesta, `Bearer`, 900s de vida.
- Refresh Token exclusivamente vía cookie `HttpOnly`/`Secure`/`SameSite`/`Path=/auth`, nunca leído por JS.
- Rotación estricta sin grace period → el frontend **debe** serializar sus llamadas de refresh (requisito contractual, RN-05).
- Reuso de Refresh Token revoca toda la familia; el cliente no distingue "expirado" de "reutilizado", solo redirige a login.
- Logout/logout-all no invalidan el Access Token ya emitido (expira solo).
- `/auth/refresh` y `/auth/logout*` no requieren Access Token.
- 403 por falta de permiso está bien definido y es distinto de 401 (token).
- El flujo mínimo cubre 6 endpoints reales, ninguno inventado.

### GAP (información ausente en los contratos, requiere verificación en integración)
GAP-01 (nombre de cookie), GAP-02 (valor de `SameSite`), GAP-03 (duración del Refresh Token), GAP-04 (header exacto del Access Token), GAP-05 (mecanismo de borrado de cookie en logout), GAP-06 (no existe recurso protegido de negocio, se reutiliza uno administrativo), GAP-07 (`mustChangeOnNextLogin` no expuesto al frontend), GAP-08 (código HTTP para cuenta no-ACTIVE con token aún vigente en endpoints protegidos genéricos), GAP-09 (500 no contractual), GAP-10 (forma exacta del cuerpo RFC 7807).

### PENDIENTE (decisión de alcance, no de información)
PENDIENTE-01 (LOCAL únicamente vs. también AD en V1 — recomendación: solo LOCAL), PENDIENTE-02 (gestión manual del usuario de prueba para 403 vs. pantalla propia — recomendación: manual en laboratorio).

---

## Orden de implementación propuesto (vertical slice)

Ajustado respecto del orden sugerido en la consigna: se fusionan "Refresh" y "Manejo 401" porque el contrato (`RN-05 SPEC-AUTH-002`) los define como un mismo mecanismo (el interceptor de 401 *es* quien dispara el refresh single-flight), y se explicita que el recurso protegido usado es administrativo (GAP-06).

1. Base del proyecto (routing mínimo: público/protegido, sin pantallas de negocio aún).
2. Cliente HTTP (`shared/http`: fetch wrapper con `credentials: 'include'`, parseo de error RFC 7807 pendiente de confirmar forma real — GAP-10).
3. Login (`provider: LOCAL` fijo — PENDIENTE-01).
4. Estado de sesión (Access Token en memoria; hidratación al montar la app vía intento silencioso de `/auth/refresh`).
5. `/auth/me` (mostrar identidad/roles/permisos tal cual los devuelve el contrato, sin campos inventados).
6. Rutas protegidas (guarda basada en sesión activa).
7. Interceptor 401 + Refresh single-flight (un solo mecanismo, ver justificación arriba).
8. Consumo de recurso protegido (`GET /auth/admin/users`) + manejo de 403 ("Acceso denegado").
9. Logout.
10. Logout all.
11. Pruebas de integración en laboratorio: cookies reales (GAP-01/02/03/05), header real (GAP-04), reuso de Refresh Token con dos pestañas, revocación administrativa (`SPEC-AUTH-004`, requiere segundo usuario admin), verificación de auditoría vía DB/backend (no hay endpoint de auditoría expuesto al frontend en estos 10 contratos).

---

## Restricciones respetadas en este relevamiento

No se modificó código ni contratos, no se instalaron dependencias, no se crearon componentes, no se inventaron endpoints ni campos de response (todo campo mostrado en este documento proviene literalmente de los ejemplos JSON de los contratos), no se asumieron comportamientos no definidos (se marcaron como GAP), no se diseñó funcionalidad futura innecesaria, y se distinguió explícitamente entre hechos documentados, inferencias (GAP-04, marcado como tal) y decisiones propuestas (PENDIENTE-01/02).
