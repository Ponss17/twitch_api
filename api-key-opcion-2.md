# API Key — Opción 2 (detalle técnico)

**Objetivo:** que la API Key **no viva permanentemente en `localStorage`**, sino que solo exista en memoria del navegador **cuando el usuario la pide explícitamente** (ver/copiar/regenerar).

**Lo que ya tenéis (a medias):**
- Cookie HttpOnly `lp_sess` → sesión del panel sin token OAuth en JS ✅
- En **Configuración**, la UI ya enmascara la key (`maskApiKey`: `sk_a••••••••1234`) cuando `keyVisible === false` ✅
- Botón **Regenerar** invalida la key anterior en servidor ✅
- Auto-ocultar tras 30 s al pulsar "Ver" (`revealKeyTemporarily`) ✅

**El problema que queda:**
- `/validate` sigue devolviendo `apiKey` → `saveSession()` la guarda en `localStorage` (`twitch_api_session`)
- Cualquier XSS en **cualquier momento** puede hacer `localStorage.getItem('twitch_api_session')` y leer la key
- El generador de comandos, export HTML, ruleta, feedback, etc. leen `session.apiKey` directamente

---

## Comparación rápida

| | Hoy | Opción 2 |
|---|---|---|
| Token OAuth | Cookie HttpOnly (servidor) | Igual |
| API Key en localStorage | Sí, siempre tras validate | No |
| API Key en pantalla | Enmascarada, pero el valor real está en memoria/LS | Solo en memoria tras pedirla al servidor |
| Bots (Nightbot, etc.) | Usuario pega URL con `?apiKey=` | Igual (la key sale al copiar comando) |
| XSS roba key sin interacción | Sí | Mucho más difícil |
| XSS mientras usuario copia | Sí | Sí (límite inherente) |

---

## Flujo propuesto (usuario en Configuración)

```
1. Usuario abre Configuración
   → Campo muestra: sk_a••••••••7f2a (solo últimos 4 chars reales, o placeholder si no se ha revelado nunca)
   → NO hay apiKey en localStorage

2. Usuario pulsa "Ver" o "Copiar"
   → GET /api/dashboard/reveal-api-key  (cookie lp_sess)
   → Backend: comprueba sesión, rate limit, log audit
   → Respuesta: { apiKey: "sk_..." }  (solo en ese JSON)
   → Frontend: guarda en useState temporal (NO saveSession)
   → Muestra en input / copia al portapapeles
   → Se borra del state y vuelve a enmascarado en el primero de estos eventos:
       - pasan 30 s, o
       - el usuario sale de Configuración, o
       - la pestaña deja de estar visible (evento `visibilitychange`) — así no queda
         expuesta si el usuario cambia de pestaña con la key en pantalla y se olvida

3. Usuario pulsa "Regenerar"
   → POST /api/system/regenerate-key (ya existe)
   → Respuesta con nueva key → mostrar UNA vez (como ahora)
   → Guardar en state temporal, no en localStorage
   → Modal: "Copia tu nueva key ahora; no la volveremos a mostrar completa"
```

---

## Backend: endpoint nuevo

**Ruta sugerida:** `GET /api/dashboard/reveal-api-key`

**Auth:** cookie `lp_sess` (igual que el resto del panel). Sin cookie → 401.
Como defensa extra y barata, exigir también un header custom (p. ej. `X-Requested-With: XMLHttpRequest`) que un `<img>` o navegación cross-site no puede añadir. Con `SameSite=Lax` ya estás cubierto en navegadores modernos, pero este header evita depender solo de eso en clientes antiguos o mal configurados.

**Rate limit sugerido:** 5 peticiones / minuto / usuario (Redis/KV, clave `rl:reveal-key:{userId}`).
Ojo: esto es más una señal de auditoría (muchas peticiones = algo raro pasa) que una protección real — una sola llamada exitosa ya expone la key completa si hay un XSS activo en ese momento. No lo vendas como "arregla el problema", solo ayuda a detectarlo.

**Respuesta exitosa:**
```json
{ "apiKey": "sk_...", "masked": "sk_a••••••••7f2a" }
```

**Log de auditoría (sin la key):**
```json
{ "event": "api_key_revealed", "userId": "...", "ip": "...", "at": "ISO8601" }
```
Usar `logger.info` o tabla `audit_logs` si ya tenéis `addAuditLog` (como en regenerate).

**Qué NO hacer:**
- No cachear la respuesta en CDN (`Cache-Control: no-store`)
- No incluir la key en logs
- No devolver la key en `/validate` (cambio importante)

---

## Cambios por archivo (checklist)

### Backend
- [ ] `system.controller.ts` → `validateToken`: quitar `apiKey` del JSON de respuesta
- [ ] `dashboard.controller.ts` → nuevo `revealApiKey`
- [ ] `dashboard.routes.ts` → `GET /reveal-api-key` + rate limiter dedicado + chequeo del header custom
- [ ] `sessionMerge.ts` / tests de validate: dejar de esperar `apiKey` en validate

### Frontend — sesión
- [ ] `sessionStorage.ts` → `stripSensitiveFields` también quita `apiKey` al guardar
- [ ] `sessionMerge.ts` → no persistir `apiKey` desde validate
- [ ] `validateSession.ts` → sesión válida con solo `userId` + cookie (ya casi está)

### Frontend — Configuración
- [ ] `SettingsView.tsx`:
  - Estado local `revealedKey: string | null`
  - `onToggleKey` / `copyKey` → llaman a `reveal-api-key` si no hay `revealedKey`
  - Listener de `visibilitychange` para limpiar `revealedKey` si la pestaña se oculta
  - No usar `session.apiKey` como fuente principal
- [ ] Tras regenerar: `revealedKey = data.apiKey`, no `saveSession({ apiKey })`

### Frontend — otros consumidores de `session.apiKey`

| Archivo | Uso actual | Solución opción 2 |
|---------|------------|-------------------|
| `CommandGeneratorCard.tsx` | Arma URL con `apiKey` en el comando | Al copiar comando "completo", pedir reveal antes |
| `CommandsViews.tsx` | Igual | Mismo patrón |
| `dataExporter.ts` | Export HTML con URLs reales | Pedir reveal al exportar, o exportar con `apiKey=••••` |
| `useRouletteController.ts` | `buildAuthQueryParam` para enviar mensaje | Usar cookie de sesión en ese endpoint |
| `FeedbackView.tsx` | Manda `apiKey` en body | Backend identifica por cookie |
| `RealtimeService.ts` | Comprueba `token \|\| apiKey` | Comprobar `userId` o cookie implícita |

---

## Fases de implementación (orden recomendado)

### Fase 1 — Backend
1. Nuevo `reveal-api-key` + rate limit + audit log + header custom
2. Quitar `apiKey` de la respuesta de `/validate`
3. Tests

### Fase 2 — Sesión
1. Dejar de guardar `apiKey` en `localStorage`
2. Migración: al cargar sesión vieja, borrar `apiKey` del objeto guardado

### Fase 3 — Configuración
1. Revelar/copiar vía endpoint
2. Regenerar sin persistir en LS
3. Modal post-regenerar "copia ahora"
4. Limpieza en `visibilitychange`

### Fase 4 — Resto del panel
1. Generador de comandos: reveal solo al copiar versión completa
2. Export: enmascarar o reveal bajo confirmación
3. Quitar `apiKey` de feedback y rutas que ya usan cookie

---

## Texto legal — activar solo tras las 4 fases

Ver `legal-edit-draft.md` → sección **API KEY**. No publicar ese texto hasta que las 4 fases estén desplegadas en producción; hasta entonces el texto legal actual (key en localStorage) es el correcto.

---

## Resumen en una frase

**Opción 2 = la API Key pasa de "siempre en el cajón del navegador" a "solo la sacas cuando la necesitas", con el servidor controlando cuándo y cuántas veces se puede pedir.**
