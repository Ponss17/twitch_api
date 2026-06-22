# Arquitectura — LosPerris Twitch API (v5)

Stack activo en `twitch_api_modern/`. El monolito Express + vanilla TS de `twitch_api/` (v4) está **archivado** — ver [`../twitch_api/LEGACY.md`](../twitch_api/LEGACY.md).

## Vista general

```
┌─────────────────────────────────────────────────────────────┐
│  Vercel / Astro SSR (frontend)                              │
│  src/pages/api/twitch/*.astro  →  React islands             │
│  Tailwind v4 (global.css) — sin public/css/                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ fetch /api/twitch/*
┌──────────────────────────▼──────────────────────────────────┐
│  Express API (backend/)                                     │
│  api/index.ts → backend/src/app.ts                          │
│  Zod schemas, JWT, Supabase, KV, Groq, tmi.js               │
└─────────────────────────────────────────────────────────────┘
```

## Rutas canónicas del frontend

Todas las páginas viven bajo **`/api/twitch/`**:

| Ruta | Página |
|------|--------|
| `/api/twitch/` | Landing |
| `/api/twitch/dashboard` | Panel streamer |
| `/api/twitch/docs` | Documentación API |
| `/api/twitch/sobre-la-api` | Info del proyecto |
| `/api/twitch/404`, `/429`, `/500`, `/offline` | Estados |

Las rutas en la raíz (`/`, `/dashboard`, …) son **redirects 308** hacia `/api/twitch/…` (Astro + `vercel.json`).

## API Express

Montaje triple (compatibilidad legacy y proxies):

- `/api/twitch/*` — prefijo principal
- `/twitch/*` — alias
- `/` — health y rutas raíz en dev

Entry point serverless: `api/index.ts` (Vercel). Local: `pnpm dev:api` (puerto 3000).

## Desarrollo local

```bash
pnpm dev          # Astro :4321 + API :3000 (concurrently)
pnpm type-check
pnpm test
pnpm test:e2e     # Playwright (requiere build o dev)
```

Variables clave en `.env`:

- `FRONTEND_URL=http://localhost:4321` — callback OAuth hacia Astro
- `PORT=3000` — API Express
- `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` — cliente realtime (Astro)

## Proxy en dev (`astro.config.mjs`)

Peticiones a `/api/twitch/*` que **no** son páginas Astro estáticas se proxean al backend `:3000`. La función `isTwitchFrontendRoute` excluye dashboard, docs, assets, etc.

## Deploy (`vercel.json`)

- **Rewrites**: catch-all API → `/api/index.ts` (excluye páginas frontend)
- **Redirects**: raíz → `/api/twitch/…`
- **Headers**: HSTS, X-Frame-Options, cache de `sw.js`
- **Assets**: `/api/twitch/img/*` → `/img/*` (rewrite) + copia en `public/api/twitch/img/`

## Checklist producción (Vercel)

```
KV_REST_API_URL + KV_REST_API_TOKEN   # rate limit (503 sin ellas)
PUBLIC_SUPABASE_URL + PUBLIC_SUPABASE_ANON_KEY
FRONTEND_URL=https://www.losperris.dev
BASE_URL=https://www.losperris.dev/api/twitch
TWITCH_REDIRECT_URI=.../api/twitch/auth/twitch/callback
```

## Estado de sesión (frontend)

`SessionProvider` envuelve el dashboard y expone `useSession()`. Las vistas no reciben `session` por props.

Tabs del dashboard sincronizados con `?tab=` en la URL (ej. `/api/twitch/dashboard?tab=clips`).

Vistas visitadas usan **keep-alive**: permanecen montadas pero ocultas; Home/Trends/Stalker/Roulette/Profile pausan polling/TMI/realtime al cambiar de tab (paridad con legacy `deactivate()`).

## PWA

Un solo service worker canónico: `public/api/twitch/sw.js`. Los archivos raíz `public/sw.js` y `public/manifest.json` fueron eliminados; Vercel redirige `/sw.js` y `/manifest.json` al mount `/api/twitch/`.

## Validación

- **Backend**: Zod en `backend/src/**/*.schema.ts` y `env.ts`
- **Tests unitarios**: Jest (`pnpm test`)
- **E2E smoke**: Playwright (`pnpm test:e2e`)

## Qué no usar

- `backend/src/core/startup/static.ts` — eliminado (HTML servido por Astro)
- `backend/src/core/utils/serveHtml.ts` — eliminado
- `public/css/*.css` — migrado a Tailwind
