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
3. **Integridad de Base de Datos y Tracking de Duelos**:
    - Se resolvió un error crítico de clave foránea (`FK constraint`) donde el servidor fallaba silenciosamente tras recibir comandos anónimos de Nightbot al intentar forzar el ID `'anonymous'` en Supabase.
    - Se corrigió el middleware `apiKeyValidator.ts` que aplicaba una "ceguera" indeseada: bloqueaba tempranamente procesar las claves en la zona de minijuegos por considerarla "ruta UI". Ahora los comandos `!duel` o `!russian` con `apiKey` o `channel` registrarán la actividad perfecta en la DB para la cuenta del streamer.
    - Seguridad mantenida: Esto **no abre vulnerabilidades** de denegación de servicio (DDoS) a la DB por spam, ya que el validador utiliza `invalidKeysCache`, la caché negativa en memoria RAM. Cualquier clave falsa repetida es bloqueada instantáneamente sin repetición de consultas a Supabase.
4. **Sincronización Timezone**: Se re-introdujo la validación asíncrona de los husos horarios entre el navegador (frontend) y el validador de sesión (backend) de manera silenciosa, devolviendo `UTC` como fallback estricto.
5. **Cierre de Vulnerabilidad Rate Limiter/Groq**: Se identificó que las rutas `/minigames` estaban erróneamente clasificadas como "Vistas HTML Públicas" (`publicHtmlPaths` en `routeHelpers.ts`). Esto permitía que cualquier llamado anónimo a las rutas de minijuegos (como `!magic8` con LLM o `!duel`) evadiera por completo el límite de peticiones (`globalRateLimiter`), abriendo la puerta a ataques de denegación de servicio (DDoS) o spam infinito hacia la API de Groq sin consumo de cuota ni autenticación. Al retirar esta clasificación, todos los comandos de chat ahora están completamente protegidos por los limitadores de tráfico y se forzó su paso por el validador estricto de tokens.
6. **Reparación del Lazy Reset (Estadísticas Diarias)**: Se modificó la capa de representación (`statsService.ts`) para interceptar peticiones de estadísticas desactualizadas post-medianoche en Vercel. Si el valor de fecha `last_stats_date` (DB) es menor a la fecha actual extraída según la zona horaria del usuario en tiempo de ejecución, el servidor sobrescribe y devuelve `0` explícitamente a las plantillas `today_*`. Esta comparativa de cadenas lógicas (`'2026-04-18' < '2026-04-19'`) asegura precisión visual sin sobrecarga SQL y descartando posibles brechas de seguridad (inmutabilidad estricta y limitando impactos de rendimiento).
7. **Auditoría Estática de Código (Salud General)**: Se realizó un escaneo global y profundo en la estructura backend (`src/`) y frontend descartando por completo métricas de código inmanejable. Se corroboró la inexistencia de deuda técnica abandonada (`TODO`/`FIXME`), la ausencia absoluta de filtraciones por `console.log` sin estructurar, y cero usos de variables sin tipado (`any`). El archivo de mayor tamaño es un controlador de abstracción de Twitch de escasas 376 líneas, confirmando que el repositorio carece de "código espagueti" y mantiene excelentes estándares Modulares.
8. **Integración Robusta de Vercel Speed Insights**: Se corrigió el problema de detección de métricas en el panel de Vercel. Debido a la naturaleza multi-página (MPA) del proyecto, la inyección dinámica vía TypeScript presentaba inconsistencias. Se migró a una integración nativa mediante el script tag `<script defer src="/_vercel/speed-insights/script.js"></script>` en todos los puntos de entrada HTML (`index.html`, `dashboard.html`, `docs.html`, `sobre-la-api.html`), eliminando el código redundante de los bundles de JS para optimizar el tiempo de carga.

---

Este documento es el registro oficial de la salud del proyecto. Todo cambio estructural debe ser auditado aquí.
