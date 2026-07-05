# Plan: Twitch API en subdominio propio

Documento de intención. **No implementado aún.** Sirve para alinear el trabajo antes de tocar producción.

## Situación actual

| Pieza | Dónde vive hoy |
|-------|----------------|
| Landing, docs, dashboard, overlays | `losperris.dev/api/twitch/…` |
| Backend (API, OAuth, webhooks) | Mismo deploy (`twitch-api-modern.vercel.app`), rutas bajo `/api/twitch/` |
| Hub LosPerris | Proxy en `vercel.json` → reescribe `/api/twitch/*` al deploy de Twitch |
| Panel admin (usuarios, logs) | Deploy aparte (`twitch_api_dashboard`), hoy sin URL pública unificada en el hub |

Otras APIs del ecosistema ya están en subdominio dedicado:

- Valorant → `vlr.losperris.dev`
- QR → `qr.losperris.dev`
- Transcripts → `dc.losperris.dev`

Twitch es el único servicio grande que sigue colgado del path `/api/twitch` en el dominio principal.

## Objetivo

Sacar **toda la superficie de Twitch** (UI + API + OAuth) a un **subdominio propio**, igual que Valorant y QR:

- Un solo origen para cookies, OAuth, PWA y comandos de bot.
- Menos carga conceptual en `losperris.dev` (el hub queda para enlazar, no para alojar la app).
- Paridad con el resto del ecosistema.

**Subdominio:** `ttv.losperris.dev`.

## Qué se movería

Todo lo que hoy responde bajo `/api/twitch/` en el deploy de Twitch:

- `/` — landing
- `/docs` — documentación
- `/dashboard` — panel de streamers (followage, clips, overlays, etc.)
- `/overlay/*` — overlays OBS
- Rutas de API: `/followage`, `/create-clip`, `/auth/*`, `/dashboard/*`, minijuegos, etc.
- Assets: `_astro`, `img`, `sw.js`, `manifest.json`

En el subdominio las rutas quedarán en la **raíz** (`ttv.losperris.dev/docs`, `ttv.losperris.dev/dashboard`) y la API operará en `/api`.

## Qué haría LosPerris (hub)

`losperris.dev` **no** duplica la lógica; solo enruta o enlaza:

1. **Fase de transición:** Se ha optado por un **corte limpio**. No habrá redirects desde `/api/twitch/*` a `ttv.losperris.dev`. Los comandos antiguos fallarán y deberán ser reconfigurados.
2. **Estado final:** el hub actualiza `apis.ts`, cards y `/actualizaciones` para apuntar al subdominio; `/api/twitch` deja de ser la URL canónica.
3. Anuncio en `/actualizaciones` sobre la nueva URL definitiva y la necesidad de actualizar los comandos.

## Cambios externos obligatorios

| Área | Acción |
|------|--------|
| **Twitch Developer Console** | Actualizar redirect URIs de OAuth al nuevo origen `https://ttv.losperris.dev/auth/twitch/callback` |
| **Comandos Nightbot / bots** | Sustituir `losperris.dev/api/twitch/…` por `ttv.losperris.dev/api/…` en plantillas y docs |
| **Vercel** | Añadir dominio `ttv.losperris.dev` en el proyecto Twitch; ajustar `vercel.json` |
| **CSP / cookies** | Revisar `connect-src` y dominios de sesión (los usuarios actuales perderán su sesión) |
| **Panel admin** | Decidir si vive en `ttv.losperris.dev/admin`, subpath del dashboard o deploy separado con proxy |

## Qué no cambia (por ahora)

- Repos: `twitch_api` (este) y `twitch_api_dashboard` pueden seguir separados; solo cambia el dominio público.
- Sync de `/actualizaciones`: Twitch **aún no** está en `UPDATE_REPOS`; cuando entre, los commits seguirán las reglas de `.agents/AGENTS.md`.
- LosPerris sigue sin panel admin de actualizaciones; solo CI + `published.json`.

## Fases sugeridas

1. **Decidir subdominio** y registrar DNS + Vercel.
2. **Desplegar** Twitch en el subdominio (staging o preview) y probar OAuth, dashboard y un comando de bot.
3. **Proxy dual** en LosPerris: `/api/twitch/*` y subdominio activos a la vez.
4. **Comunicar** en `/actualizaciones` + actualizar docs y generador de comandos.
5. **Redirects permanentes** desde `/api/twitch` → subdominio; quitar rewrites del hub cuando el tráfico sea estable.
6. **Limpieza** de referencias viejas en código, README y entradas manuales en `published.json`.

## Criterio de “hecho”

- Usuario nuevo llega desde el hub al subdominio sin romper flujos.
- OAuth y al menos followage + create-clip + dashboard funcionan en producción.
- No quedan URLs canónicas públicas en docs que digan `losperris.dev/api/twitch` (salvo nota histórica temporal).

---

*Última revisión: julio 2026. Actualizar este archivo cuando se fije el subdominio o se acorte el alcance.*
