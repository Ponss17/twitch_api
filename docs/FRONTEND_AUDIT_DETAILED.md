# Frontend Audit — Detallado

Fecha: 2026-05-03
Nota global: 8.0 / 10

## Resumen ejecutivo

Este informe cubre el frontend del proyecto (`frontend/` y `public/`), su integración con la API, riesgos de seguridad en cliente, pruebas necesarias, y un plan priorizado de mejoras con acciones PR-ready. La base es sólida: arquitectura modular, carga dinámica de módulos, utilidades compartidas y buenas prácticas (caching L1/L2, lazy CSS). Los principales riesgos detectados son exposición accidental de `apiKey`/`token` en URLs y usos de `innerHTML` sin sanitizar en ciertos puntos.

## Hallazgos clave

- Arquitectura:
    - `Dashboard` gestiona módulos dinámicos y llama a `init`/`activate` (ver `frontend/core/dashboard.ts`).
    - HTML está separado en `public/components/*.html` y cargado por `HtmlLoader` — buena separación markup/JS.

- Seguridad y XSS:
    - Uso extensivo de `innerHTML` en plantillas (ej. `frontend/features/dashboard/commands/templates.ts`, `stalker/templates.ts`) y generación dinámica de `code`/`data-path` en `public/docs.html`.
    - Muchas salidas de fetch se pasan por `UI.escapeHTML` (correcto), pero hay lugares sin sanitización explícita.
    - URLs construidas con `apiKey` o `token` como query (p. ej. `DataExport.buildCommandRows`, `CommandsModule.updateCommand`, `ClipsModule.loadClips`) — riesgo de fuga si el usuario copia comparte URLs o si hay scripts que leen el DOM.

- Autenticación y almacenamiento:
    - `session` contiene `apiKey` y `token`. Revisar persistencia: no debe guardarse `token` en `localStorage` si no es estrictamente necesario.
    - Logout debe limpiar `session`, `localStorage` y `sessionStorage` (revisar flujo en `frontend/core/auth.ts`).

- Integraciones en tiempo real:
    - Usa `tmi.min.js` para chat; hay lógica para conectar/desconectar y listeners (Trends/Stalker). Validar reconexión y límites para evitar loops.

- Tests y cobertura:
    - Falta E2E que cubran OAuth/login, carga dashboard y flujos críticos (run test, feedback). Muchos módulos UI no tienen tests unitarios que verifiquen sanitización y manejo de errores de fetch.

## Riesgos concretos y mitigaciones

1. Exposición de credenciales en URLs
    - Riesgo: `apiKey` aparece en URLs generadas y en ejemplos.
    - Mitigación: nunca renderizar `apiKey` completo en DOM. Mostrar máscara (ej: `abcd••••••••wxyz`) y usar copy-to-clipboard que solicita el secreto al backend vía endpoint autenticado.
    - Tests: unidad que verifique que el `apiKey` no excede 8 caracteres visibles en el DOM.

2. XSS por `innerHTML`
    - Riesgo: plantillas que interpolan variables sin escape.
    - Mitigación: reemplazar `innerHTML` por creación DOM (createElement/textContent) o aplicar `UI.escapeHTML` a todas las interpolaciones. Añadir ESLint rule para evitar `innerHTML` directo en nuevos commits.
    - Tests: pruebas JSDOM que inyecten payloads y verifiquen que no se ejecutan scripts.

3. Tokens en almacenamiento persistente
    - Riesgo: tokens guardados en `localStorage` son persistentes y pueden ser robados por XSS.
    - Mitigación: usar `sessionStorage` o cookie HttpOnly+Secure para tokens; minimizar lifetime del token en cliente.

4. Dependencias vendidas y vulnerabilidades
    - Riesgo: `tmi.min.js` incluido localmente y otras libs.
    - Mitigación: mantener escaneo (`pnpm audit`) y política de actualización semestral.

## Prioridad y plan de acción (PRIORITARIO → menos urgente)

1. Alta: Evitar exposición de `apiKey` en DOM (Implementar ahora)
    - Cambios PR-ready:
        - `frontend/features/dashboard/account/dataExporter.ts`: en `buildCommandRows` cambiar `&apiKey=${apiKey}` por `&apiKey=[MASKED]` y añadir botón que llame a `/api/twitch/key/peek` (POST) para devolver temporalmente la clave (backend valida usuario).
        - `public/components/profile.html`: `input#profile-api-key` mostrar máscara por defecto; el botón `profile-regen-key` debe invocar endpoint backend.
    - Tests: unit test que renderice la UI y asegure que en el DOM solo aparece string con máscara.

2. Alta: Revisar y sanitizar todas las `innerHTML` (XSS hardening)
    - Archivos a cambiar primero:
        - `frontend/features/dashboard/commands/templates.ts` -> convertir a creación DOM o aplicar `UI.escapeHTML` a cada interpolación.
        - `frontend/features/dashboard/stalker/templates.ts`
        - `frontend/features/dashboard/trends/templates.ts` si lo hay.
    - Añadir helper `safeInnerHTML(el, html)` que aplica sanitizer y uso obligatorio.

3. Alta: Añadir E2E Playwright
    - Scenarios:
        - Login OAuth flow (redirect handling), esperar dashboard, comprobar módulos cargan.
        - Run followage test: rellena `test-channel`/`test-user` y pulsa `run-test-btn`, comprobar resultado exitoso.
        - Submit feedback: rellenar y enviar, comprobar petición al backend (mockable) y UI success.
    - Comandos de ejemplo para instalar/run:

```bash
pnpm add -D @playwright/test
npx playwright install
npx playwright test tests/e2e/login.spec.ts
```

4. Medio: Unit tests JSDOM para módulos UI críticos
    - Crear tests en `tests/frontend/` con `jest-environment-jsdom`.
    - Mocks: `fetch`, `TmiService`, `TabSyncService`.
    - Skeleton example (Jest):

```ts
// tests/frontend/commands.test.ts
import { CommandsModule } from '../../../frontend/features/dashboard/commands/module';
import '@testing-library/jest-dom';

describe('CommandsModule', () => {
    beforeEach(() => {
        document.body.innerHTML = `<div id="bot-select-test"></div>`;
    });
    it('genera output sin exponer apiKey', () => {
        // set session mock and call updateCommand, assert output masked
    });
});
```

5. Medio: Auditoría de dependencias y actualizar `tmi.min.js` si hay release
    - `pnpm audit --report` y corregir CVEs críticos.

6. Bajo: Perf/UX
    - Prefetch módulos más usados, optimizar imágenes, revisar cache-control en `public/`.

## PR-ready code changes sugeridos (resumen)

- `frontend/features/dashboard/account/dataExporter.ts`:
    - Reemplazar concatenación de `apiKey` visible por máscara.
    - Añadir botón `Reveal key` que hace `POST /api/twitch/user/peek-key` y muestra temporalmente en clipboard.

- `frontend/features/dashboard/commands/templates.ts`:
    - Reescribir `generateCard` para usar `document.createElement` y `textContent` en lugar de interpolar HTML para campos `title`, `desc`, `info`.

- `frontend/features/dashboard/commands/module.ts`:
    - En `_runApiTest`, sanear `text` de respuesta con `UI.escapeHTML` (ya se usa), y marcar copy-to-clipboard handler para no exponer `data-realValue` en DOM, usar atributo dataset con token enmascarado.

## Ejemplos de tests y scripts (rápido)

- Añadir dependencias dev:

```bash
pnpm add -D @playwright/test jest @types/jest jest-environment-jsdom @testing-library/dom
```

- Playwright test skeleton (`tests/e2e/login.spec.ts`):

```ts
import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
    await page.goto('http://localhost:3000/api/twitch/dashboard');
    // simular redirección oauth y comprobar que dashboard carga
});
```

- Jest unit skeleton (por módulo) en `tests/frontend/*.test.ts`.

## Checklist de entrega rápida (qué haré si apruebas)

- [ ] Generar PR con cambios para enmascarar `apiKey` y `profile-api-key`.
- [ ] Añadir tests unitarios JSDOM para `CommandsModule` y `ClipsModule`.
- [ ] Crear suite Playwright mínima con 3 E2E tests.
- [ ] Añadir ESLint rule contra `innerHTML` sin comentario justificativo.

## Appendix: archivos y líneas referencia rápida

- `frontend/core/dashboard.ts` — inicio y carga de módulos (importante para E2E).
- `frontend/features/dashboard/commands/module.ts` — generación de comandos y tests UI.
- `frontend/features/dashboard/commands/templates.ts` — usa `innerHTML` para cards.
- `frontend/features/dashboard/clips.ts` — fetch / caching / render.
- `frontend/features/dashboard/stalker/templates.ts` — plantillas con `innerHTML`.
- `public/components/*.html` — markup cargado dinámicamente.

Si quieres que implemente ya alguno de los PR-ready cambios (p. ej. enmascarar `apiKey` y añadir endpoint backend mínimo para `peek-key`), dime cuál y lo aplicaré: puedo (1) crear PR-ready patches en el repo, (2) añadir tests unitarios y E2E skeletons, o (3) generar la suite Playwright e instrucciones para ejecutarla localmente.

-- Fin del informe detallado
