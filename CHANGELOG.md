# Changelog

Todos los cambios notables del proyecto se documentan aquí.

---

## [v4.2.0] - 2026-06-08

### Optimización Crítica de Vercel (CPU/Latencia)

- **Fast Drop (Bot Firewall)**: Implementado en `middleware.ts` para rechazar de inmediato escáneres web (`.php`, `.env`, `wp-login`, etc.) y evitar picos de "Active CPU".
- **Micro-caché Edge (CDN)**: Añadidos headers `Cache-Control` en `commands.controller.ts` para cachear peticiones concurrentes de bots a `!followage` y `!shoutout`, y en `seo.controller.ts` para rutas SEO.
- **Paralelización de Tracking**: El guardado de métricas, estadísticas y logs de actividad en `tracking.ts` ahora usa `Promise.allSettled`, reduciendo la latencia percibida por los bots de Twitch.

### Funcionalidades / Seguridad

- **Ruleta Rusa (Hardcore)**: Añadido permiso `moderator:manage:banned_users` a `auth.service.ts` para habilitar correctamente el timeout automático al perder en la ruleta rusa.

---

## [v4.1.0] - 2026-05-06

### Refactor exhaustivo: eliminación de código duplicado e innecesario

#### Archivos eliminados (código muerto)

| Archivo                                 | Razón                                                        |
| --------------------------------------- | ------------------------------------------------------------ |
| `frontend/shared/utils/apiCache.ts`     | Cero imports, superado por `cacheService.ts`                 |
| `frontend/shared/utils/uiSkeleton.ts`   | Cero imports, módulos usan skeletons inline                  |
| `frontend/shared/utils/logger.ts`       | Cero imports (distinto del logger Winston en `src/`)         |
| `frontend/shared/utils/errorHandler.ts` | Cero imports, nunca inicializado                             |
| `frontend/core/ui.ts`                   | Re-export innecesario, 15 imports redirigidos a `ui-core.ts` |

#### Funciones/exports eliminados

| Archivo                                           | Función/Export                            | Razón                           |
| ------------------------------------------------- | ----------------------------------------- | ------------------------------- |
| `src/core/utils/validationHelpers.ts`             | `isValidTimezone()`                       | Cero imports                    |
| `src/core/utils/logger.ts`                        | `logger.request()`, `logger.endRequest()` | Cero usos                       |
| `src/core/utils/time.ts`                          | Export de `formatDurationSpanish`         | Solo se usa internamente        |
| `frontend/features/dashboard/stalker/messages.ts` | `loadError`                               | Duplicado exacto de `infoError` |
| `src/types/express.d.ts`                          | Campo `twitchUser`                        | Nunca leído ni escrito          |

#### Carpetas renombradas

| Antes                   | Después                     | Razón                                                       |
| ----------------------- | --------------------------- | ----------------------------------------------------------- |
| `frontend/shared/i18n/` | `frontend/shared/messages/` | No es un sistema i18n, solo strings hardcodeados en español |

#### Bug fixes

| Archivo                         | Fix                                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| `public/css/base.css`           | Añadido `--text-tertiary: #52525b` (usado en `common.css` pero undefined)                       |
| `public/css/dashboard.css`      | Eliminado `@keyframes fadeIn` duplicado (idéntico a `base.css`)                                 |
| `public/css/dashboard.css`      | Eliminado bloque `@media (max-width: 640px)` duplicado                                          |
| `public/css/sections/about.css` | Variables `:root` renombradas con prefijo `--about-` para evitar colisión con `base.css`        |
| `public/index.html`             | Eliminado bloque `<style>` inline de 7KB (todo duplicaba `base.css`/`layout.css`/`landing.css`) |

#### Nuevos archivos

| Archivo                          | Contenido                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| `src/core/utils/boundedCache.ts` | Clases genéricas `BoundedMap`, `BoundedSet`, `NegativeCache` para reemplazar cache manual duplicado |
| `tests/helpers/mockExpress.ts`   | Helpers compartidos `mockReq()`, `mockRes()`, `mockNext()`                                          |

#### Refactors de backend

| Cambio                                                                            | Archivos afectados                                                                                  |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Cache manual → `BoundedMap`/`BoundedSet`/`NegativeCache`                          | `apiKeyValidator.ts`, `authMiddleware.ts`                                                           |
| `isBotCommand()` e `isApiRoute()` extraídos a `routeHelpers.ts`                   | `errorMiddleware.ts`, `apiKeyValidator.ts`, `authMiddleware.ts`, `redisRateLimiter.ts`, `routes.ts` |
| `safeString` importado desde `validationHelpers` en vez de inline                 | `authMiddleware.ts`                                                                                 |
| Interfaz local `TwitchApiError` eliminada de `twitchAuthHelpers.ts`               | `twitchAuthHelpers.ts`                                                                              |
| Logger mock global añadido a `tests/setup.ts`                                     | Elimina mocks duplicados en 16 archivos de test                                                     |
| `isBotCommand` ahora incluye `/send-message` (antes faltaba en `apiKeyValidator`) | `routeHelpers.ts`                                                                                   |

#### Refactors de frontend

| Cambio                                                                                  | Archivos afectados                                                      |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Carpeta `i18n/` → `messages/`                                                           | 10+ archivos con imports actualizados                                   |
| `Messages.Common` enriquecido con `spinner()`, `dangerText()`, `emptyState()`           | `shared/messages/messages.ts`                                           |
| 7 archivos de mensajes usan `Messages.Common` en vez de duplicar strings                | `commands`, `duel`, `magic8`, `clips`, `feedback`, `account`, `stalker` |
| `BIO_EMPTY` constante compartida                                                        | `profileMessages.ts`, `stalker/messages.ts`                             |
| `AuthMessages.sessionExpired` y `expired` delegan a `Messages.Common.sessionExpiredMsg` | `authMessages.ts`                                                       |
| `BaseModule` extendido con `setLoading()` y `formatApiError()`                          | `baseModule.ts`                                                         |
| 3 módulos usan `this.formatApiError()` en vez de `import()` dinámico                    | `duel/module.ts`, `magic8/module.ts`, `russian/module.ts`               |
| `ClipsModule` migrado a `BaseModule.initBase()` y `authHeaders()`                       | `clips.ts`                                                              |
| 15 imports actualizados `core/ui.js` → `core/ui-core.js`                                | Múltiples archivos frontend                                             |
| `about.css` variables CSS renombradas con prefijo `--about-`                            | Evita colisión con `base.css`                                           |

#### Escalabilidad de tests

| Cambio                                           | Archivos afectados             |
| ------------------------------------------------ | ------------------------------ |
| Helper `mockExpress.ts` creado                   | `tests/helpers/mockExpress.ts` |
| `authMiddleware.test.ts` usa helpers compartidos | Migrado parcialmente           |

---

## [v4.0.1] - 2025-05-05

### Archivos modificados

| Archivo                                               | Tipo de cambio                          |
| ----------------------------------------------------- | --------------------------------------- |
| `src/core/utils/serveHtml.ts`                         | **Nuevo**                               |
| `src/core/startup/routes.ts`                          | Reescrito                               |
| `src/core/startup/static.ts`                          | Reescrito                               |
| `src/core/middleware/errorMiddleware.ts`              | Reescrito                               |
| `src/core/middleware/redisRateLimiter.ts`             | Reescrito                               |
| `src/core/middleware/localOnly.ts`                    | Reescrito                               |
| `src/core/database/userService.ts`                    | Reescrito                               |
| `scripts/migrate-tokens.ts`                           | Editado (variable muerta)               |
| `tests/middleware/localOnly.test.ts`                  | Actualizado (mock socket.remoteAddress) |
| `docs/architecture/ARCHITECTURE.md`                   | Actualizado                             |
| `docs/troubleshooting/error-acceso-admin-401.md`      | Actualizado                             |
| `docs/troubleshooting/error-encriptacion-tokens.md`   | Actualizado                             |
| `docs/troubleshooting/errores-redis-y-resiliencia.md` | Actualizado                             |

### Seguridad

- **`localOnly.ts`**: `req.ip` → `req.socket.remoteAddress`. Con `trust proxy: 1`, `req.ip` confía en `X-Forwarded-For`, permitiendo spoofing. `socket.remoteAddress` no es falsificable.
- **`static.ts`**: `express.static` del admin ahora solo sirve `.js` y `.css`. Antes servía `.html`, permitiendo acceder a páginas admin sin nonce CSP.

### Rendimiento

- **`serveHtml.ts`** (nuevo): Cache en memoria de templates HTML (`Map<string, string>`). Primer request lee disco, siguientes solo reemplazan nonce. Elimina I/O por request.
- **`userService.ts`**: `decryptAndMigrateIfNeeded()` reemplaza `decryptTokenWithFallback()`. Antes, cada request hacía `saveUser()` + invalidaba 3 cachés (L1 userId, L1 login, L2 apiKey). Ahora solo migra si se usó la llave legacy. Requests normales: 0 writes a Supabase, 0 deletes a KV.
- **`userService.ts`**: `isAlreadyEncrypted()` valida que `iv` y `ciphertext` sean hex válidos, no solo que existan.

### Bug Fixes

- **`errorMiddleware.ts`**: Ahora es `async`, espera `serveHtml`. Antes no esperaba la promesa → respuesta vacía en errores 500.
- **`redisRateLimiter.ts`**: `handleLimitExceeded` ahora es `async`, usa `serveHtml` para 429. Reemplaza `sendFile` con ruta relativa que fallaba en Vercel serverless (`./public/...` → `path.join(process.cwd(), 'public/...')`).
- **`userService.ts`**: `getUserByApiKey()` retorna `null` si el descifrado falla. Antes retornaba el usuario con tokens cifrados ilegibles.
- **`migrate-tokens.ts`**: Eliminada variable `alreadyCorrectCount` sin uso.

### Refactor

- **Eliminación total de `sendFile()`**: Todo HTML pasa por `serveHtml()`. Páginas de error (404, 429, 500), dashboard y admin incluidos.
- **`routes.ts`**: Rutas admin cubren todas las variantes (`/admin`, `/admin/`, `/admin/login`, `/admin/login.html`, `/admin/dashboard`, `/admin/dashboard.html`). Handler 404 usa `serveHtml` con status 404.
- **`static.ts`**: Admin static sirviendo solo `.js/.css`, páginas HTML van por `serveHtml` vía `routes.ts`.

---

## [v4.0.0] - 2025-05-04

### Inicial

- Release estable de LosPerrisAPI v4.0.0.
- Suite de 132 tests.
- PWA estabilizada.
- Rate limiter con temporizador persistente.
- Dashboard store reactivo.
- Sentry y CI/CD configurados.
- 3 rondas de auditoría técnica, 17 hallazgos corregidos.
