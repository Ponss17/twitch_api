# LosPerris Twitch API (v5)

API y panel para streamers de Twitch: comandos de bot (Nightbot, StreamElements), dashboard con analíticas, clips, minijuegos con IA y OAuth seguro. Stack **Astro + React + Tailwind** (frontend) y **Express** (backend), desplegado en Vercel.

**Producción:** [ttv.losperris.dev](https://ttv.losperris.dev)

## Estructura

```text
twitch_api/
├── api/                 # Entry Vercel → Express serverless
├── backend/src/         # API Express (features, middleware, Supabase, KV)
├── src/                 # Frontend Astro + React + Tailwind
│   ├── components/      # Landing, docs, dashboard, vistas
│   ├── layouts/         # BaseLayout.astro
│   ├── lib/             # Auth, config, TabSync, caché, exportación
│   └── pages/           # /, /dashboard, /docs, /404, /429, /500, /offline
├── public/              # PWA (manifest, sw.js), assets
├── tests/               # Jest (backend + frontend) + Playwright E2E
└── vercel.json          # Rewrites API + rutas estáticas desde dist/
```

## Requisitos

- Node.js ≥ 22.12
- pnpm (recomendado)

## Desarrollo local

```bash
cd twitch_api
cp .env.example .env   # rellena credenciales (ver scripts/check-env.js)
pnpm install
pnpm dev               # Astro :4321 + API :3000
```

| Servicio   | URL |
| ---------- | --- |
| Frontend   | http://localhost:4321/ |
| API health | http://localhost:3000/health |

## Scripts

```bash
pnpm dev           # Frontend + API en paralelo
pnpm build         # Compila backend + Astro (dist/)
pnpm lint          # ESLint
pnpm type-check    # Astro check + tsc backend
pnpm test          # Jest (339 tests)
pnpm test:e2e      # Playwright (API real + smoke UI; primera vez: npx playwright install chromium)
pnpm smoke         # Checklist manual de producción
pnpm check-env     # Valida .env antes de arrancar la API
```

## Calidad y CI

- **pnpm** 9.15.9 (`packageManager` en `package.json`); overrides y `onlyBuiltDependencies` en `package.json#pnpm`
- **Husky**: pre-commit (`lint` + `type-check`), pre-push (`test`)
- **GitHub Actions**: `.github/workflows/ci.yml` — lint, type-check, test, build

## Deploy (Vercel)

- Páginas estáticas/SSR: Astro (`dist/`)
- API: `vercel.json` reescribe `/api/*`, `/auth/*` y `/twitch/*` hacia `api/index.js`
- Variables: `.env.example` y sección Deploy en [ARCHITECTURE.md](ARCHITECTURE.md)

### Smoke manual en producción

URL canónica: `https://ttv.losperris.dev` (ventana incógnito, sin extensiones).

1. Landing `/` carga sin errores en consola
2. Login Twitch → dashboard con avatar
3. Recarga: sesión persiste
4. Pestañas actualizan URL (`/dashboard/clips`, etc.)
5. Stalker/ruleta: chat TMI conecta
6. Logout vuelve al landing

Antes de desplegar: `pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e`

### Logs en producción

Con `VERCEL=1`, cada petición API se loguea en JSON (`requestId`, duración, status, región). En local: `LOG_VERBOSE=1`.

## Contratos de API

Los endpoints públicos para bots mantienen compatibilidad con integraciones existentes:

- Prefijos: `/api/*`, `/twitch/*`, `/auth/*`
- Autenticación: API Key (`X-Api-Key`) u OAuth (dashboard)
- Rate limiting: Vercel KV (bot/API key) o memoria (sesión dashboard)

Documentación interactiva: `/docs` (en producción: `https://ttv.losperris.dev/docs`).

## Arquitectura

Detalle técnico, dependencias pnpm, deuda pendiente y SQL Supabase: [ARCHITECTURE.md](ARCHITECTURE.md).

## Licencia

Proyecto privado — LosPerris.
