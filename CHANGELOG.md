# Changelog

Todos los cambios notables del proyecto se documentan aquí.

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
