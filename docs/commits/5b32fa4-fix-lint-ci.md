# Commit `5b32fa4` — Fix lint CI

## Metadatos

| Campo | Valor |
|-------|-------|
| **Hash** | `5b32fa4` |
| **Rama** | `master` |
| **Fecha** | 2026-07-01 |
| **Tipo** | `fix(lint)` |
| **Alcance** | 4 archivos · +10 / −10 líneas |
| **Commit padre** | `983654b` — refactor frontend + overlays OBS |

## Mensaje del commit

```
fix(lint): corregir errores de ESLint que fallaban en CI

Actualiza overrides tras la migración a core/, habilita globals Node en
scripts .mjs, corrige dependencias de useOverlayMirror y reemplaza var
por const en layouts.
```

## Contexto

El job de CI `pnpm run lint` fallaba con 17 errores y 2 warnings tras el refactor `983654b`. Este commit corrige todos los problemas sin relajar reglas globales.

## Errores corregidos

### `eslint.config.mjs`

| Problema | Solución |
|----------|----------|
| `no-console` en `debugLog.ts` | Override actualizado: `src/lib/debugLog.ts` → `src/core/logging/debugLog.ts` |
| `no-undef` en `scripts/restructure-src.mjs` | Patrón `scripts/**/*.{js,mjs}` con `globals.node` |
| Scripts `.mjs` sin entorno Node | `sourceType: 'module'` para scripts ESM |

### `src/features/tools/overlay/hooks/useOverlayMirror.ts`

| Problema | Solución |
|----------|----------|
| `react-hooks/exhaustive-deps` — expresión compleja en deps | Extraer `isRouletteSpinning` antes del `useEffect` |
| Dependencia `state` implícita | Depender solo de `isRouletteSpinning` (valor derivado) |

### `src/layouts/BaseLayout.astro` y `DocsLayout.astro`

| Problema | Solución |
|----------|----------|
| `no-var` en script inline de preload de fuentes | `var link` → `const link` |

## Archivos modificados

- `eslint.config.mjs`
- `src/features/tools/overlay/hooks/useOverlayMirror.ts`
- `src/layouts/BaseLayout.astro`
- `src/layouts/DocsLayout.astro`

## Verificación

```bash
pnpm run lint   # exit 0, sin errores ni warnings
```
