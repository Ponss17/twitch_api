# Remodelación y Refactorización de Seguridad (Abril 2026)

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
