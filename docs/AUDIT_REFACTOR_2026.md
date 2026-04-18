# Remodelación y Refactorización de Seguridad (Abril 2026)

## Segunda Auditoría - 16 Abril 2026 (13 problemas)

### 🔴 Críticos

1. **`STATS_CACHE` sin límite** → Añadido `MAX_STATS_CACHE_SIZE = 500` con eviction FIFO.
2. **`pendingKVRequests` sin límite** → Añadido `MAX_PENDING_SIZE = 500` con eviction.
3. **`recordSuccess()` desperdiciando ops KV** → Solo sincroniza cuando el estado cambia (no era CLOSED antes). Elimina ~1000 `kv.del()` innecesarios por minuto.

### 🟠 Altos

4. **Doble query API Key** → Normalización a formato UUID con guiones antes de la primera query. Eliminada la segunda query fallback.
5. **`getSummary` secuencial** → `getFollowersCount` y `getUserStats` ahora se ejecutan en paralelo con `Promise.all`.
6. **`getUserInfo` secuencial** → Misma paralelización aplicada.
7. **Migración de cifrado repetida** → `migratedUsersCache` Set previene re-cifrado en la misma instancia.
8. **Logger loop infinito** → Circuit breaker en `DatabaseTransport`: tras 3 fallos consecutivos, pausa escrituras a DB por 60 segundos.

### 🟡 Medios

9. **`Intl.DateTimeFormat` recreado** → `dateFormatterCache` Map reutiliza formatters por timezone.
10. **`cacheService.del()` inconsistente** → Ahora también limpia `pendingKVRequests`.
11. **Doble serialización JSON en followage** → Eliminado `JSON.stringify/parse` redundante.
12. **`playDuel` async innecesario** → Removido `async`, ahora es síncrono puro.
13. **Bearer tokens sin caché positiva** → `validTokensCache` con TTL de 30s evita revalidar contra Twitch API en cada request.

---

Este documento detalla todas las modificaciones de optimización, prevención y limpieza del código ejecutadas durante la mitigación de los **47 Problemas de Análisis Críticos**.

## 🔴 Mitigación de Vulnerabilidades Críticas

1. **Memory RAM Leakage & Eviction Limits**
   Los Mapas/Diccionarios temporales causantes de interrupciones del servidor (OOM) ahora cuentan con un tamaño máximo estático (1000 iteraciones) y expulsión FIFO (First-In, First-Out) controlada:
    - `lastActiveThrottle` y `invalidTokensCache` aplicados en `authMiddleware.ts`.
    - Lógica paralela aplicada a `EXISTS_CACHE` en `statsService.ts`.

2. **Supresión Abierta / Null Check Pointers**
    - Eliminación del "Error Swallowing": Reemplazamos 6 silenciadores asíncronos (`.catch(() => {})`) con correctos seguimientos en `logger.error` para Vercel Logs. (Aplicados a Circuit Breakers e Invalidadores Oauth).
    - Solucionados los de-referenciamientos `null checks` al invocar o intentar extraer IDs de una creación de clips nula desde Twitch.

3. **Restricción Strict "Open Redirect"**
    - Corregimos el `bypass` de los validadores `.endsWith()` que autorizaba tokens falsos mediante dominios "parecidos" (como `apilosperris.dev.com`). Las cadenas requeridas deben ser `===` de ahora en adelante.

## 🟠 Prevenciones Estructurales "Thundering Herd" (DB)

4. **Promise-Lock Mutex ("Thundering Herd")**
   Introdujimos _Mutexes Lógicos_ a través del agrupamiento de promesas pendientes. Si un aluvión de múltiples conexiones (10+) fallan y cruzan simultáneamente la L1 (Caché), se detendrán en memoria para agrupar 1 sola lectura genuina contra "Supabase / Vercel KV".
    - Lock incorporado a centralidad: `cacheService.ts`.
    - Lock a Database Gets `userCache` en `authMiddleware.ts`.

5. **Resolución N+1 SQL / Casteo de Tipos**
   Parchados los casteadores perezosos `current as unknown` por verificaciones indexadas estrictas en base de datos (`statsService`).

## 🟡 Cierres Laterales (QoL & Dry-Run)

6. **Reglas Anti-Spoofing de Orígenes CSRF**
   Asegurado que, para bypassear la restricción CSRF enviando una clave secreta (`?apiKey=`), el navegador que consuma la API _físicamente carezca de referenciadores / user-agent HTML_, permitiendo sólo consumos robóticos lícitos (como el querido Nightbot).
7. **Normalizaciones TS & Refactorización de Bloques Gemelos**
   Centralizamos la redundancia total al generar los Checkers lógicos `fiveMinutesFromNow` encontrados en 2 partes masivas en `auth.service`. Unidos bajo la utilería única `ensureValidToken`.
   Finalmente, los status API ahora aceptan el estandar global de Axios/Express (`err.statusCode` a la par que `err.status`).

## Fase 4 - Estabilización y Reset Forzado (Abril 2026)

Tras detectar regresiones en la integración del Dashboard y la lógica de comandos, se procedió a realizar un **Hard Reset** al punto de estabilidad conocido (`8bba712`).

### Acciones ejecutadas:

1. **Git Hard Reset**: Retorno al commit `8bba712` para limpiar el exceso de lógica de sanitización.
2. **Force Push**: Sincronización del repositorio remoto y disparo de nuevo despliegue en Vercel.
3. **Estado Actual**: El proyecto se encuentra en un estado minimalista funcional, priorizando la estabilidad del Timezone y OAuth sobre la limpieza agresiva de inputs.

---

Este documento es el registro oficial de la salud del proyecto. Todo cambio estructural debe ser auditado aquí.
