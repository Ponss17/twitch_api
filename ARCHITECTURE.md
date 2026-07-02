# Arquitectura — LosPerris Twitch API (v5)

Stack activo en `twitch_api/`. El monolito v4 está archivado en `legacy/` (solo referencia).

## Vista general

```
┌─────────────────────────────────────────────────────────────┐
│  Vercel / Astro (frontend)                                  │
│  src/pages/api/twitch/*.astro  →  React islands             │
│  Tailwind v4 (global.css)                                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ fetch /api/twitch/*
┌──────────────────────────▼──────────────────────────────────┐
│  Express API (backend/)                                     │
│  api/index.ts → backend/src/app.ts                          │
│  Zod, OAuth, Supabase, Vercel KV, Groq, tmi.js              │
└─────────────────────────────────────────────────────────────┘
```

## Rutas canónicas del frontend

Todas las páginas viven bajo **`/api/twitch/`**:

| Ruta | Página |
|------|--------|
| `/api/twitch/` | Landing |
| `/api/twitch/dashboard` | Panel streamer |
| `/api/twitch/dashboard/{tab}` | Tab del dashboard (followage, clips, …) |
| `/api/twitch/docs` | Documentación API |
| `/api/twitch/sobre-la-api` | Info del proyecto |
| `/api/twitch/overlay/roulette` | OBS — ruleta (mirror) |
| `/api/twitch/overlay/trends` | OBS — tendencias (mirror) |
| `/api/twitch/404`, `/429`, `/500`, `/offline` | Estados |

Las rutas en la raíz (`/`, `/dashboard`, …) redirigen (308) hacia `/api/twitch/…` (`vercel.json` + Astro).

## Paths compartidos (backend ↔ frontend)

Dos utilidades mantienen el mismo mount `/api/twitch`:

| Contexto | Módulo | Uso |
|----------|--------|-----|
| Backend (redirects OAuth, 429 HTML) | `backend/src/core/utils/frontendPaths.ts` | `frontendPagePath('/dashboard')` |
| Frontend (links, router) | `src/core/config/paths.ts` | `appPath('/dashboard')` |

Ambos deben seguir apuntando a `/api/twitch` — no mezclar con rutas raíz.

## API Express

Montaje triple (compatibilidad bots y proxies):

- `/api/twitch/*` — prefijo principal
- `/twitch/*` — alias
- `/` — health y rutas raíz en dev

Entry serverless: `api/index.ts`. Local: `pnpm dev:api` (puerto 3000).

## OAuth seguro

1. Callback Twitch → redirect con `?auth=<token>` (HMAC, 5 min), **sin** API key en URL permanente.
2. Frontend llama `GET /auth/exchange?auth=…` → recibe `apiKey` + perfil.
3. Sesión en `localStorage` (scoped por `userId` vía `src/core/session/localPrefs.ts`); validación vía `/system/validate` con caché local por fingerprint de sesión.
4. `invalidateSession()` centraliza logout local y sync entre pestañas (`BroadcastChannel`).

## Caché (Vercel KV)

Capas por tipo de dato:

| Capa | Dónde | TTL típico | Uso |
|------|--------|------------|-----|
| **L1 RAM** | Instancia serverless (`userMemoryCache`, `validKeysCache`, rate limit dashboard) | 10 min / ventana 1 min | Bots activos y panel en la misma instancia — **0 ops KV** |
| **L2 KV** | Vercel Redis (`twitch_api:` prefix) | Ver `cacheTtl.ts` | Compartido entre réplicas; metadatos API key **sin tokens OAuth** |
| **L3 DB** | Supabase | — | Solo en miss de L1+L2 |

**Migración Supabase (obligatoria en prod):** ejecutar `docs/supabase/optimizations.sql` — índices, `token_expires_at`, RPC `trim_activity_logs` y `record_user_request` con fecha local.

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
- `BASE_URL=http://localhost:3000/api/twitch`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — inyectadas en Astro vía `astro.config.mjs` (`define`)
- `KV_REST_API_*` — opcional en dev; obligatorio en producción (rate limit)

## Proxy en dev (`astro.config.mjs`)

Peticiones a `/api/twitch/*` que no son páginas Astro se proxean al backend `:3000`.

## Deploy (`vercel.json`)

- **Rewrites**: API → `/api/index.ts`; tabs del dashboard → `/dashboard`
- **Redirects**: raíz → `/api/twitch/…`
- **Headers**: HSTS, X-Frame-Options, cache de `sw.js`

## Checklist producción (Vercel)

```
TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET / ENCRYPTION_KEY
TWITCH_REDIRECT_URI=https://www.losperris.dev/api/twitch/auth/twitch/callback
BASE_URL=https://www.losperris.dev/api/twitch
FRONTEND_URL=https://www.losperris.dev
SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY / SUPABASE_JWT_SECRET
KV_REST_API_URL + KV_REST_API_TOKEN
GROQ_API_KEY (opcional — Bola 8)
```

## Estructura del frontend (`src/`)

Organización **feature-based**, alineada con el backend (`core/` + `features/`):

```
src/
├── core/                 # Infraestructura transversal (sin UI de dominio)
│   ├── api/              # auth, authQuery, apiError
│   ├── cache/            # cacheService
│   ├── config/           # config, paths, pageTitle
│   ├── errors/           # rateLimitCooldown
│   ├── logging/          # debugLog, logError
│   ├── session/          # context, useSession, localPrefs, loadProgress
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
- Tab activo: path `/dashboard/{tab}` + fallback `localStorage` + compatibilidad `?tab=` legacy
- Vistas con **keep-alive**: Home/Trends/Stalker pausan polling/realtime al cambiar de tab

## PWA

Service worker canónico: `public/api/twitch/sw.js`. Vercel redirige `/sw.js` al mount `/api/twitch/`.

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
- **Tests**: Jest (`pnpm test`) — 204 tests · Playwright E2E en CI
- **E2E**: Playwright smoke (`pnpm test:e2e`)
- **CI**: GitHub Actions en push/PR
