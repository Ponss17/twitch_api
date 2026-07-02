# Commit `983654b` — Refactor frontend + overlays OBS

## Metadatos

| Campo | Valor |
|-------|-------|
| **Hash** | `983654b570b273205a30c5fca281a29b838743ea` |
| **Rama** | `master` |
| **Fecha** | 2026-07-01 21:28:10 (-0600) |
| **Autor** | Ponss17 \<jeancastrogudiel@gmail.com\> |
| **Tipo** | `refactor(frontend)` |
| **Alcance** | 149 archivos · +3179 / −1602 líneas |

## Mensaje del commit

```
refactor(frontend): adoptar arquitectura core/shared/features y overlays OBS

Reorganiza src/ eliminando lib/, components/ y hooks/ dispersos. Añade rutas
/overlay/roulette y /overlay/trends con mirror vía Redis, script de migración
y documentación actualizada.
```

## Resumen

Este commit unifica dos trabajos grandes:

1. **Reorganización del frontend** — De una estructura plana (`lib/`, `components/`, `hooks/`) a una arquitectura **feature-based** alineada con el backend (`core/` + `features/`).
2. **Overlays OBS** — URLs separadas para ruleta y tendencias en modo mirror (el dashboard controla; OBS solo lee estado).

## Nueva estructura `src/`

```
src/
├── core/                 # Infraestructura transversal
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
│   ├── dashboard/
│   ├── commands/
│   ├── clips/
│   ├── minigames/
│   ├── feedback/
│   ├── marketing/
│   ├── docs/
│   ├── legal/
│   ├── about/
│   ├── chat/             # tmiService, chatLogStore, useTmiChat
│   └── tools/            # roulette, trends, overlay, stalker
├── pages/
├── layouts/
└── styles/
```

### Carpetas eliminadas

- `src/lib/` (incluidos shims deprecados de overlay/ruleta)
- `src/components/`
- `src/hooks/`

## Overlays OBS

### Rutas frontend

| Ruta canónica | Descripción |
|---------------|-------------|
| `/api/twitch/overlay/roulette` | Mirror de la ruleta para OBS |
| `/api/twitch/overlay/trends` | Mirror de tendencias para OBS |

### Arquitectura mirror

- **Dashboard** = controlador (TMI, APIs, publicación de estado).
- **Overlay** = solo lectura; hace polling al backend (~450 ms, ~200 ms durante spin).
- Estado en Redis: clave `overlay:state:{userId}:{tool}`, TTL 2 h.

### Archivos clave

**Backend**

- `backend/src/features/dashboard/overlay/controller.ts`
- `backend/src/features/dashboard/overlay/schema.ts`
- Rutas en `backend/src/features/dashboard/dashboard.routes.ts`
- TTL en `backend/src/core/config/cacheTtl.ts` (`OVERLAY_STATE`)

**Frontend**

- `src/features/tools/overlay/` — apps, hooks, sync, types
- `src/features/tools/roulette/` — componentes, hooks, wheelUtils, eligibility
- `src/features/tools/trends/` — componentes, hooks
- `src/layouts/OverlayLayout.astro`
- `src/pages/overlay/roulette.astro`
- `src/pages/overlay/trends.astro`

**API endpoints (dashboard)**

- `PUT/GET /dashboard/overlay-state/:tool` — leer/escribir estado
- `POST /dashboard/overlay-link` — URL firmada para OBS

## Tabla de migración de imports

| Antes | Después |
|-------|---------|
| `@/lib/config` | `@/core/config/config` |
| `@/lib/auth` | `@/core/api/auth` |
| `@/lib/sessionContext` | `@/core/session/context` |
| `@/hooks/useSession` | `@/core/session/useSession` |
| `@/lib/dashboard*` | `@/features/dashboard/lib/*` |
| `@/hooks/useTmiChat` | `@/features/chat/hooks/useTmiChat` |
| `@/components/ui/*` | `@/shared/ui/*` |
| `@/components/DashboardApp` | `@/features/dashboard/app/DashboardApp` |
| `@/components/views/*` | `@/features/*/components/*` |

## Script de migración

`scripts/restructure-src.mjs`

```bash
# Migración completa (moves + imports + limpieza)
node scripts/restructure-src.mjs

# Solo reescritura de imports y eliminación de shims
node scripts/restructure-src.mjs --imports-only
```

## Tests añadidos / actualizados

- `tests/controllers/overlayStateController.test.ts` (nuevo)
- `tests/unit/frontend/rouletteWheelUtils.test.ts` (nuevo)
- Tests frontend existentes actualizados a rutas `@/core/*` y `@/features/*`

## Otros cambios

- `ARCHITECTURE.md` — documentación de estructura frontend/backend y rutas overlay
- `vercel.json` — rewrites para `/overlay/roulette` y `/overlay/trends`
- `astro.config.mjs` — rutas overlay
- `BaseLayout.astro` / `DocsLayout.astro` — preload de fuentes sin `onload` inline (elimina hints de TypeScript)

## Verificación realizada

```bash
pnpm type-check   # 0 errors, 0 warnings, 0 hints
pnpm build        # 13 páginas estáticas
pnpm test         # 260 tests passing
```

## Convenciones post-commit

- Imports entre features vía `@/features/...`
- Infra compartida vía `@/core/...` o `@/shared/...`
- Evitar imports relativos que crucen carpetas de feature
- `pages/` y `layouts/` solo hacen wiring; la lógica vive en `features/`
