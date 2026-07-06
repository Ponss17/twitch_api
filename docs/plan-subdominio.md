# Plan: Twitch API en subdominio propio

**Estado: completado (julio 2026).** El subdominio `ttv.losperris.dev` es la URL canónica para UI, API y OAuth. El hub LosPerris ya apunta al subdominio.

## Situación actual

| Pieza | Dónde vive hoy |
|-------|----------------|
| Landing, docs, dashboard, overlays | `https://ttv.losperris.dev/` (mount raíz) |
| Backend (API, OAuth, webhooks) | Mismo deploy; API en `/api/*`, OAuth en `/api/auth/*` |
| Hub LosPerris | Actualizado — enlaces y cards apuntan a `ttv.losperris.dev` |
| Panel admin | Deploy aparte (`twitch_api_dashboard`), sin URL pública unificada en el hub |

Paridad con el resto del ecosistema:

- Valorant → `vlr.losperris.dev`
- QR → `qr.losperris.dev`
- Transcripts → `dc.losperris.dev`
- **Twitch → `ttv.losperris.dev`**

## Qué se migró

Todo lo que antes respondía bajo `/api/twitch/` en el deploy de Twitch:

- `/` — landing
- `/docs` — documentación
- `/dashboard` — panel de streamers (followage, clips, overlays, etc.)
- `/overlay/*` — overlays OBS
- Rutas de API: `/api/followage`, `/api/create-clip`, `/api/auth/*`, `/api/dashboard/*`, minijuegos, etc.
- Assets: `_astro`, `img`, `sw.js`, `manifest.json`

En el subdominio las rutas quedan en la **raíz** (`ttv.losperris.dev/docs`, `ttv.losperris.dev/dashboard`) y la API opera en `/api`.

## Transición

Se optó por un **corte limpio**: no hay redirects desde `/api/twitch/*` al subdominio. Los comandos antiguos deben usar `ttv.losperris.dev/api/…`.

## Cambios aplicados

| Área | Estado |
|------|--------|
| **Código** (`312238b` + fixes) | Mount raíz, `vercel.json`, `frontendPaths`, `PRODUCTION_URLS`, `ALLOWED_ORIGINS` |
| **Vercel** | Dominio `ttv.losperris.dev` en el proyecto Twitch |
| **Twitch Developer Console** | `https://ttv.losperris.dev/api/auth/twitch/callback` |
| **Hub LosPerris** | Cards, `apis.ts` y `/actualizaciones` actualizados |
| **Comandos Nightbot / bots** | Plantillas y docs con `ttv.losperris.dev/api/…` |

## Qué no cambia (por ahora)

- Repos: `twitch_api` (este) y `twitch_api_dashboard` siguen separados; solo cambió el dominio público.
- Sync de `/actualizaciones`: Twitch **aún no** está en `UPDATE_REPOS`; cuando entre, los commits seguirán las reglas de `.agents/AGENTS.md`.
- Panel admin: sin decisión final de URL pública unificada.

## Criterio de “hecho” — cumplido

- [x] Usuario llega desde el hub al subdominio sin romper flujos.
- [x] OAuth y al menos followage + create-clip + dashboard funcionan en producción.
- [x] URL canónica pública: `ttv.losperris.dev` (no `losperris.dev/api/twitch`).
- [x] Hub LosPerris actualizado.

## Limpieza residual en este repo (opcional, no bloquea)

Algunos tests y docs internos (`SMOKE-PROD.md`, tests con `/api/twitch/` en paths) pueden seguir mencionando rutas legacy — no afectan producción. Se pueden barrer en mantenimiento posterior.

---

*Última revisión: julio 2026 — migración cerrada.*
