# LosPerris Twitch API — Modern Stack

Reescritura completa de `twitch_api` con **Astro + React + Tailwind** en el frontend y **Express** en el backend, manteniendo **la misma lógica y contratos de API** para no romper integraciones con Nightbot, StreamElements u otros bots.

## Estructura

```text
twitch_api_modern/
├── api/                 # Entry point Vercel (Express serverless)
├── backend/src/         # Lógica API (portada desde twitch_api/src)
├── src/                 # Frontend Astro + React + Tailwind
│   ├── components/      # Landing, Docs, Dashboard, vistas
│   ├── layouts/         # BaseLayout.astro
│   ├── lib/             # Auth, config, TabSync, cache, dataExporter
│   └── pages/           # /, /dashboard, /docs, /404, /429, /500, /offline
├── public/              # PWA (manifest, sw.js), assets
├── tests/               # Jest (131 tests, backend)
└── vercel.json          # API → Express, resto → Astro
```

## Qué se mantiene igual

- Todos los endpoints bajo `/api/twitch/*`, `/twitch/*` y `/auth/*`
- Middlewares: API key, OAuth, rate limiting, CSRF
- Servicios: Twitch Helix, Supabase, KV, Groq IA, cifrado AES
- Esquema de base de datos (mismo Supabase)

## Qué cambia

| Antes (`twitch_api`)        | Ahora (`twitch_api_modern`)      |
| --------------------------- | -------------------------------- |
| HTML estático + Vanilla TS  | Astro SSR + React                |
| CSS modular (~4800 líneas)  | Tailwind CSS v4                  |
| Esbuild frontend            | Vite (via Astro)                 |
| Express sirve HTML + API    | Astro sirve páginas, Express API |

## Desarrollo local

```bash
cd twitch_api_modern
cp .env.example .env   # rellena con tus credenciales
pnpm install
pnpm dev               # Astro :4321 + API :3000 (proxy configurado)
```

- Frontend: http://localhost:4321
- API directa: http://localhost:3000/api/twitch/health

## Build, tests y deploy

```bash
pnpm build           # Astro + compila backend TypeScript
pnpm lint            # ESLint
pnpm test            # Jest (backend + frontend)
pnpm type-check      # Astro check + tsc backend
pnpm test:e2e        # Playwright smoke
pnpm smoke           # Imprime checklist manual de producción
pnpm start           # Solo API (producción local)
```

En Vercel: Astro maneja las páginas; `vercel.json` reescribe rutas API hacia `api/index.ts`.

### Husky (hooks de git)

Tras `git init`, `pnpm install` activa Husky automáticamente:

- **pre-commit**: `lint` + `type-check`
- **pre-push**: `pnpm test`

### Smoke manual en producción

Checklist imprimible: `pnpm smoke` o [docs/SMOKE-PROD.md](docs/SMOKE-PROD.md)

### Logs en Vercel

En despliegues Vercel (`VERCEL=1`) cada petición API se logea en JSON con `requestId`, duración, status, IP, `userAgent`, región y `x-vercel-id`. Errores 4xx/5xx siempre se logean. En local: `LOG_VERBOSE=1` en `.env`.

## Estado de migración — 100% completa

| Área | Estado |
| ---- | ------ |
| Landing (hero terminal, bento, FAQ) | ✅ |
| Docs interactivas (sidebar, búsqueda, code tabs) | ✅ |
| Sobre la API (narrativa + canvas sparks) | ✅ |
| Dashboard (12 tabs) | ✅ |
| TabSync leader election (Home) | ✅ |
| Clips (caché, favoritos, paginación) | ✅ |
| Export datos perfil (HTML) | ✅ |
| PWA (manifest + service worker) | ✅ |
| Páginas error 404/429/500/offline | ✅ |
| Tests Jest backend | ✅ 131/131 |
| API backend | ✅ Portado 1:1 |

## Origen

Este proyecto es una reescritura **únicamente** de `twitch_api` (no `twitch_api_dashboard`). El backend se portó desde `twitch_api/src/` y el frontend desde `twitch_api/frontend/` + `twitch_api/public/`.
