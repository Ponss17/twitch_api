# Arquitectura — LosPerris Twitch API (v5)

Stack activo en `twitch_api/`. El monolito v4 está archivado en `legacy/` (solo referencia).

**Producción:** `https://ttv.losperris.dev` — frontend en raíz, API en `/api/*`.

## Vista general

```
┌─────────────────────────────────────────────────────────────┐
│  Vercel / Astro (frontend)                                  │
│  src/pages/*.astro  →  React islands                      │
│  Tailwind v4 (global.css)                                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ fetch /api/*
┌──────────────────────────▼──────────────────────────────────┐
│  Express API (backend/)                                     │
│  api/index.js → backend/src/app.ts                          │
│  Zod, OAuth, Supabase, Vercel KV, Groq, tmi.js              │
└─────────────────────────────────────────────────────────────┘
```

## Rutas canónicas del frontend

Todas las páginas viven en la **raíz** del subdominio (`APP_MOUNT = ''` en `src/core/config/paths.ts`):

| Ruta | Página |
|------|--------|
| `/` | Landing |
| `/dashboard` | Panel streamer |
| `/dashboard/{tab}` | Tab del dashboard (followage, clips, …) |
| `/docs` | Documentación API |
| `/legal`, `/legal#privacidad`… | Legal unificado (tabs por hash) |
| `/sobre-la-api` | Info del proyecto |
| `/overlay/roulette` | OBS — ruleta (mirror) |
| `/overlay/trends` | OBS — tendencias (mirror) |
| `/404`, `/429`, `/500`, `/offline` | Estados |

Redirects en `vercel.json`: `/privacidad`, `/terminos`, `/cookies` → `/legal#…`.

## Paths compartidos (backend ↔ frontend)

Dos utilidades mantienen el mismo mount (raíz):

| Contexto | Módulo | Uso |
|----------|--------|-----|
| Backend (redirects OAuth, 429 HTML) | `backend/src/core/utils/frontendPaths.ts` | `frontendPagePath('/dashboard')` |
| Frontend (links, router) | `src/core/config/paths.ts` | `appPath('/dashboard')` |

Ambos usan `APP_MOUNT = ''` — no mezclar con el path legacy `/api/twitch/`.

## API Express

Montaje en `backend/src/core/startup/routes.ts`:

- `/api/*` — router principal (`backend/src/routes/index.ts`)
- `/twitch/*` — alias (compat bots)
- `/auth/*` y `/api/auth/*` — OAuth

Entry serverless: `api/index.js`. Local: `pnpm dev:api` (puerto 3000).

## OAuth seguro

1. Callback Twitch → `GET /api/auth/twitch/callback` → redirect con `?auth=<token>` (HMAC, 5 min), **sin** API key en URL permanente.
2. Frontend llama `GET /api/auth/exchange?auth=…` → recibe perfil; cookie `lp_sess` (API Key bajo demanda vía `reveal-api-key`).
3. Sesión: cookie HttpOnly `lp_sess` + metadatos en `localStorage` (sin API Key persistida); validación vía `/system/validate` con **caché local dinámica** (hasta 35 min antes de `tokenExpiresAt`, o 1 h sin OAuth).
4. El panel no monta hasta que `validateSession` termina (`readOptimisticAuthState`); llamadas concurrentes a validate se deduplican.
5. `invalidateSession()` centraliza logout local y sync entre pestañas (`BroadcastChannel` en `sessionLifecycle.ts`).
6. Tras validate OK, `sessionAuthGrace` (2 min) + `apiFetch` reintenta 401 transitorios sin logout; el panel usa `logoutOn401: false` en summary/activity/profile.

## Caché (Vercel KV)

Capas por tipo de dato:

| Capa | Dónde | TTL típico | Uso |
|------|--------|------------|-----|
| **L1 RAM** | Instancia serverless (`userMemoryCache`, `validKeysCache`; RL solo fallback) | 10 min / ventana 1 min | Bots activos / panel en la misma instancia — **0 ops KV** en hit de usuario |
| **L2 KV** | Vercel Redis (`twitch_api:` prefix) | Ver `cacheTtl.ts` | Compartido entre réplicas; metadatos API key **sin tokens OAuth** |
| **L3 DB** | Supabase | — | Solo en miss de L1+L2 |

**Migración Supabase (obligatoria en prod):** ejecutar `scripts/supabase/optimizations.sql` — índices, `token_expires_at`, RPC `trim_activity_logs` y `record_user_request` con fecha local.

- TTLs centralizados: `backend/src/core/config/cacheTtl.ts`
- Dashboard summary: perfil Twitch (5 min) + analytics Supabase (60 s)
- Invalidación al borrar stats, regenerar key o eliminar cuenta: `invalidateAllUserCaches()` (`backend/src/core/utils/cacheInvalidation.ts`)
- KV API key cache guarda solo metadatos (sin tokens OAuth); usuario completo en L1 RAM + `cache:user:id` en KV

## Desarrollo local

```bash
pnpm dev          # Astro :4321 + API :3000
pnpm type-check
pnpm test
pnpm test:e2e     # Playwright (dev:web o build previo)
```

Variables clave en `.env`:

- `TWITCH_REDIRECT_URI` — callback OAuth (obligatoria)
- `FRONTEND_URL=http://localhost:4321`
- `BASE_URL=http://localhost:3000/api`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — inyectadas en Astro vía `astro.config.mjs` (`define`)
- `KV_REST_API_*` — opcional en dev; obligatorio en producción (rate limit)

## Proxy en dev (`astro.config.mjs`)

Peticiones a `/api/*` se proxean al backend `:3000`.

## Deploy (`vercel.json`)

- **Rewrites**: `/api/*`, `/auth/*`, `/twitch/*` → `api/index.js`; páginas Astro desde `dist/`
- **Headers**: HSTS, X-Frame-Options, cache de `/sw.js`

## Checklist producción (Vercel)

```
TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET / ENCRYPTION_KEY
HMAC_SIGNING_SECRET (≥32, obligatorio en producción)
TWITCH_REDIRECT_URI=https://ttv.losperris.dev/api/auth/twitch/callback
BASE_URL=https://ttv.losperris.dev/api
FRONTEND_URL=https://ttv.losperris.dev
SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY / SUPABASE_JWT_SECRET
KV_REST_API_URL + KV_REST_API_TOKEN
GROQ_API_KEY (opcional — Bola 8)
```

**Rate limit:** dashboard OAuth (`rl:sess:`), bots/API key e IP anónima usan KV (500/min dashboard). L1 solo si KV no está disponible.

## Estructura del frontend (`src/`)

Organización **feature-based**, alineada con el backend (`core/` + `features/`):

```
src/
├── core/                 # Infraestructura transversal (sin UI de dominio)
│   ├── auth/             # Sesión cliente modular (storage, validate, oauth, apiFetch)
│   ├── api/              # Barrel auth.ts → @/core/auth; apiError, fetchWithRetry
│   ├── cache/            # cacheService
│   ├── config/           # config, paths, pageTitle
│   ├── errors/           # rateLimitCooldown
│   ├── logging/          # debugLog, logError
│   ├── session/          # context, useSession, localPrefs, loadProgress, useProactiveTokenRefresh
│   ├── types/            # twitch
│   └── ui/               # tw, utils, clipboard, animateValue, docsTw
├── shared/               # UI reutilizable entre features
│   ├── ui/               # Modal, Dropdown, Icon, Skeleton, …
│   ├── layout/           # Footer
│   ├── providers/        # SessionProvider
│   └── errors/           # ErrorPage, RateLimitPage
├── features/             # Módulos de dominio
│   ├── dashboard/        # app, components, hooks, lib
│   ├── commands/         # components, hooks, lib
│   ├── clips/
│   ├── minigames/
│   ├── feedback/
│   ├── marketing/
│   ├── docs/
│   ├── legal/
│   ├── about/
│   ├── chat/             # tmiService, chatLogStore, useTmiChat
│   └── tools/            # roulette, trends, overlay, stalker
├── pages/                # Rutas Astro (solo wiring)
├── layouts/
└── styles/
```

**Convenciones de imports:** alias `@/` → `src/`. Imports entre features vía `@/features/...`; infra compartida vía `@/core/...` o `@/shared/...`. Evitar imports relativos que crucen carpetas de feature.

**Migración:** `node scripts/restructure-src.mjs` (moves iniciales) · `node scripts/restructure-src.mjs --imports-only` (reescritura de imports + limpieza).

## Estructura del backend (`backend/src/`)

```
backend/src/
├── core/                 # config, database, middleware, utils, errors
├── features/             # auth, commands, dashboard, games, system, twitch
├── routes/               # index (montaje de routers)
├── types/
├── app.ts
└── serverless.ts
```

## Sesión y dashboard (frontend)

- `SessionProvider` + `useSession()` — sin pasar sesión por props
- Paquete `src/core/auth/` — lógica de sesión; imports legacy `@/core/api/auth`
- Splash post-OAuth: `features/dashboard/lib/splashFlags.ts` (re-exportado desde `@/core/auth`)
- Tab activo: path `/dashboard/{tab}` + fallback `localStorage` + compatibilidad `?tab=` legacy
- Vistas con **keep-alive**: Home/Trends/Stalker pausan polling/realtime al cambiar de tab

## PWA

Service worker canónico: `public/sw.js`. Vercel sirve `/sw.js` con headers de cache en `vercel.json`.

## Contratos de error (JSON)

Rutas **dashboard**, **system** y **auth/exchange** devuelven errores con forma unificada:

```json
{
  "success": false,
  "error": {
    "message": "Descripción legible en español",
    "code": "UNAUTHORIZED",
    "details": []
  }
}
```

- Comandos de bot (`/followage`, `/create-clip`, …) siguen respondiendo **texto plano** (Nightbot).
- El frontend usa `extractApiErrorMessage()` (`src/core/api/apiError.ts`) — compatible con respuestas legacy `{ error: "..." }`.
- Helper backend: `backend/src/core/utils/jsonResponse.ts` · detector: `isJsonApiRoute()`.

## Validación

- **Backend**: Zod (`*.schema.ts`, `env.ts`)
- **Tests**: Jest (`pnpm test`) — ~369 tests · Playwright E2E en CI
- **E2E**: Playwright smoke (`pnpm test:e2e`)
- **CI**: GitHub Actions en push/PR

## Dependencias (pnpm)

| Pieza | Valor actual | Notas |
|-------|--------------|-------|
| CI | `pnpm/action-setup@v4` → **9** | `.github/workflows/ci.yml` |
| Local | `packageManager: "pnpm@9.15.9"` | `corepack prepare pnpm@9.15.9 --activate` |
| Overrides seguridad | `package.json#pnpm.overrides` | `yaml`, `js-yaml@3`, `esbuild` — compatible con pnpm 9 |
| Postinstall en CI | `onlyBuiltDependencies` | `esbuild`, `sharp`, `unrs-resolver` (pnpm 9.15+ exige allowlist) |
| Vercel | `lockfileVersion: 9.0` | No usa `packageManager` salvo `ENABLE_EXPERIMENTAL_COREPACK=1` en el dashboard |

## Deuda técnica y pendientes

Puntos **fuera** del cierre de auditoría jul 2026 — no mezclar con parches de bajo riesgo:

| ID | Tema | Detalle |
|----|------|---------|
| **🔴9** | Subir a **pnpm 11** | Migración deliberada: `pnpm-workspace.yaml`, `allowBuilds`, revisar CI y Vercel. No usar `package.json#pnpm.overrides` (ignorado en v11). Punto aparte de deploy. |
| **🟡** | Shared contracts FE/BE | `DashboardProfile` / `ActivityLogEntry`: `backend/src/core/schemas/dashboardContracts.ts` (`@contracts/*`). Analytics payload aún tipado suelto. |
| **🟡** | a11y residual | Charts Recharts / menú dropdown arrow-keys / splash como `<dialog>` — base dashboard (sidebar inert, modales labelled, tooltips teclado) ya aplicada. |
| **🟡** | Tests `frontendPaths` + `dist/` | `tests/unit/frontendPaths.test.ts` puede flakear si `pnpm test` y `pnpm build` corren en paralelo (dist/ a medias). CI serial no falla; opcional: evaluar existencia por test o mover al job build. |
| **🟡** | Smoke prod desactualizado en notas locales | Checklist en `docs/SMOKE-PROD.md` (local) aún menciona `/api/twitch/`; producción canónica es `https://ttv.losperris.dev`. |

### Cierre auditoría jul 2026 (aplicado en código)

- Overlay scope global, auth exchange single-use, delete-account CASCADE, AES-GCM, `HMAC_SIGNING_SECRET` **obligatorio en prod**, OAuth state con `exp`, circuit breaker en interceptor axios (+ `recordSuccess` en respuestas Helix), CI URLs canónicas, `pnpm audit` en CI, timezone dashboard alineado con perfil, debounce stats revision bump, invalidación caches Helix, redacción unificada de query secrets en logs, heavy RL con fallback L1, dashboard RL en KV, boot sin 401 (validate gate + dedupe), caché validate TTL dinámico, refactor `src/core/auth/`, contratos dashboard `@contracts/*`, a11y base panel, gracia post-validate en `apiFetch` (jul 2026).

## Documentación

| Qué | Dónde |
|-----|--------|
| Arquitectura y contratos | `ARCHITECTURE.md` (este archivo) |
| Documentación completa (file-by-file) | `DOCUMENTATION.md` |
| Inicio rápido | `README.md` |
| SQL Supabase prod | `scripts/supabase/optimizations.sql` |
| Notas internas / IA / planes | Carpeta `docs/` — **solo local**, en `.gitignore`, no se publica en GitHub |

La carpeta `docs/` (`LOG.md`, `AI-CONTEXT.md`, `DOCUMENTATION.md`, `SMOKE-PROD.md`) queda para trabajo local y agentes; el repo remoto no la incluye (`.gitignore`).
