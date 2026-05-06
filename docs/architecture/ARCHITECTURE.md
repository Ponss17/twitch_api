# Arquitectura de LosPerrisAPI (twitch_api v4.0.0)

## Índice

1. [Visión General](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Flujo de Request](#flujo-de-request)
5. [Estrategia de Caché](#estrategia-de-caché)
6. [Autenticación y Autorización](#autenticación-y-autorización)
7. [Rate Limiting](#rate-limiting)
8. [Resiliencia](#resiliencia)
9. [Seguridad](#seguridad)
10. [Base de Datos](#base-de-datos)
11. [Frontend](#frontend)
12. [Decisiones de Diseño](#decisiones-de-diseño)

---

## Visión General

LosPerrisAPI es un dashboard y API para streamers de Twitch que expone comandos de chat (clips, followage, shoutout, ruleta rusa, bola 8 mágica, duelos) y un panel de analytics en tiempo real. Está diseñada para funcionar en **Vercel (serverless)** con **Supabase** como base de datos y **Vercel KV (Redis)** como caché distribuida.

### Principios de diseño

- **Serverless-first**: Cada request es independiente; no hay estado compartido en memoria entre invocaciones.
- **Cache-everything**: Múltiples niveles de caché para minimizar llamadas a APIs externas y a la base de datos.
- **Fail-safe**: Circuit breaker, rate limiting, y caché negativa para degradación graceful.
- **Vanilla frontend**: Sin frameworks (React/Vue/Svelte) — TypeScript compilado con esbuild para mínimo bundle size.
- **Defense in depth**: CSP con nonces, encriptación de tokens, CORS restrictivo, rate limiting por IP/sesión/API key.

---

## Stack Tecnológico

| Capa          | Tecnología                  | Justificación                                          |
| ------------- | --------------------------- | ------------------------------------------------------ |
| Runtime       | Node.js 20+                 | Soporte nativo de ESM, `fetch`, `crypto`               |
| Servidor      | Express 5                   | Maduro, tipado, middleware ecosistema                  |
| Lenguaje      | TypeScript 5.9 (strict)     | Seguridad de tipos, mantenibilidad                     |
| Base de datos | Supabase (PostgreSQL)       | Postgres managed, row-level security, realtime         |
| Caché         | Vercel KV (Redis)           | Distribuida entre instancias serverless, baja latencia |
| IA            | Groq SDK (LLaMA 3.3 70B)    | Generación de respuestas para Bola 8 Mágica            |
| Logging       | Winston + AsyncLocalStorage | Request tracing, transporte a BD, sanitización         |
| Monitoreo     | Sentry                      | Error tracking en producción                           |
| Build (BE)    | `tsc` (TypeScript compiler) | Output CommonJS compatible con Vercel                  |
| Build (FE)    | esbuild                     | Compilación rápida, bundling, minificación             |
| Testing       | Jest + Supertest            | Unit tests, integration tests                          |
| CI/CD         | GitHub Actions + Vercel     | Lint → TypeCheck → Test → Build → Deploy               |

---

## Estructura del Proyecto

```
twitch_api/
├── api/index.ts              # Entrypoint Vercel + dev server
├── src/
│   ├── app.ts                # Configuración y arranque de Express
│   ├── core/                 # Infraestructura compartida
│   │   ├── config/           # Variables de entorno, límites, mensajes, orígenes
│   │   ├── database/         # Fachada DB + servicios especializados
│   │   │   ├── dbService.ts          # Re-exporta todos los servicios (Fachada)
│   │   │   ├── supabaseClient.ts     # Cliente Supabase (service_role)
│   │   │   ├── userService.ts        # CRUD de usuarios, encriptación de tokens
│   │   │   ├── cacheService.ts       # Caché L1 (memoria) + L2 (KV)
│   │   │   ├── activityService.ts    # Log de actividad de usuario
│   │   │   ├── statsService.ts       # Métricas y estadísticas
│   │   │   ├── adminService.ts       # Gestión de admins y listado de usuarios
│   │   │   ├── auditService.ts       # Auditoría de operaciones sensibles
│   │   │   └── cryptoService.ts      # AES-256-CBC para tokens de Twitch
│   │   ├── errors/           # Jerarquía de errores (AppError, TwitchApiError)
│   │   ├── middleware/       # Middleware de Express
│   │   │   ├── errorMiddleware.ts    # Handler global async + serveHtml para errores
│   │   │   ├── apiKeyValidator.ts    # Validación de API Key con caché
│   │   │   ├── authMiddleware.ts     # Validación de token de sesión
│   │   │   ├── redisRateLimiter.ts   # Rate limiting con KV + serveHtml para 429
│   │   │   ├── validate.ts           # Validación de schemas con Zod
│   │   │   ├── cspNonce.ts           # Nonce único por request para CSP
│   │   │   ├── csrfProtection.ts     # Protección CSRF
│   │   │   └── localOnly.ts          # Restricción a localhost (socket.remoteAddress)
│   │   ├── startup/          # Configuración del pipeline de arranque
│   │   │   ├── middleware.ts        # Orden de middlewares y Helmet CSP
│   │   │   ├── routes.ts           # Rutas HTML con serveHtml + API routes
│   │   │   └── static.ts          # Archivos estáticos (JS/CSS, no HTML)
│   │   └── utils/            # Helpers (logger, tracking, sentry, validación, serveHtml)
│   ├── features/             # Lógica de negocio (Feature-based)
│   │   ├── auth/             # OAuth Twitch (login, callback, refresh)
│   │   ├── commands/         # Comandos de chat (clip, followage, shoutout, send)
│   │   ├── dashboard/        # Analytics, actividad, clips, perfil, gestión de cuenta
│   │   ├── games/            # Ruleta Rusa, Bola 8 Mágica, Duelo
│   │   ├── system/           # Health check, feedback, regeneración de API Key, realtime
│   │   └── twitch/           # Cliente HTTP de la API de Twitch + Circuit Breaker
│   ├── routes/               # Router principal y admin proxy
│   └── types/                # Interfaces TypeScript compartidas
├── frontend/                 # TypeScript vanilla (sin frameworks)
│   ├── core/                 # Auth, Dashboard, Store, UI base, Realtime
│   ├── features/dashboard/   # Módulos del dashboard (1 por pestaña)
│   ├── shared/               # Componentes UI, i18n, utilidades
│   ├── services/             # Cache service, TMI (Twitch IRC)
│   └── vendor/               # tmi.min.js
├── public/                   # Assets estáticos (HTML, CSS, JS compilado, imágenes)
├── admin/                    # Panel de administración (solo local)
├── tests/                    # Tests unitarios, de integración, de middleware
├── scripts/                  # Build scripts
└── docs/                     # Documentación
```

### ¿Por qué esta estructura?

- **`core/` vs `features/`**: Separación entre infraestructura reusable y lógica de negocio específica. Si se añade una nueva feature (ej. encuestas), solo se toca `features/`.
- **Fachada en `dbService.ts`**: Centraliza las importaciones desde los controladores. Si un servicio de BD se refactoriza, los controladores no cambian sus imports.
- **Feature-based con `*.controller.ts` + `*.service.ts` + `*.routes.ts` + `*.schema.ts`**: Cada feature es autocontenida. Las rutas y schemas Zod viven junto al controller que las usa.
- **Frontend separado en `frontend/`**: Compila a `public/js/` con esbuild. El frontend no depende de Node.js ni de Express.

---

## Flujo de Request

```
Cliente (Navegador / Nightbot / API externa)
       │
       ▼
Vercel Rewrites (vercel.json)
       │
       ▼
api/index.ts → app.ts
       │
       ├─ 1. validateConfig()          ← ¿Variables de entorno presentes?
       ├─ 2. initSentry()              ← ¿Monitoreo activo?
├─ 3. configureMiddleware()     ← Helmet, CORS, CSP nonce, Compression, JSON parser
├─ 4. configurePageRoutes()     ← Rutas HTML con serveHtml + inyección de nonce
├─ 5. configureStatic()         ← CSS, JS (no HTML — los sirve serveHtml)
       ├─ 6. configureRoutes()         ← Middleware de auth + API routes
       │       │
       │       ├─ apiKeyValidator      ← ¿API Key en query/header? → Caché/KV/DB
       │       ├─ checkToken           ← ¿Token de sesión? → Validar en Twitch
       │       ├─ globalRateLimiter    ← ¿Límite excedido? → KV
       │       ├─ Routes
       │       │   ├─ /auth/*          ← OAuth Twitch (login, callback)
       │       │   ├─ /api/twitch/*
       │       │   │   ├─ /minigames/* ← Ruleta Rusa, Bola 8, Duelo
       │       │   │   ├─ /dashboard/* ← Analytics, actividad, clips
       │       │   │   ├─ /system/*    ← Health, feedback, realtime
       │       │   │   └─ / (commands) ← Clip, followage, shoutout, send
       │       │   └─ /api/admin/*     ← Panel admin (solo local)
       │       ├─ 404 Handler
       │       └─ Error Handler (Sentry + respuesta formateada)
```

### ¿Por qué las rutas HTML van antes que los estáticos?

Express, al encontrar una carpeta `public/dashboard/`, puede devolver un 301 redirect. Para evitarlo, las rutas HTML se registran explícitamente antes de `express.static()`.

### ¿Por qué rutas duplicadas (`/api/twitch/*` y `/twitch/*`)?

Compatibilidad con dos dominios:

- `https://www.losperris.dev/api/twitch/...` (URL canónica)
- `https://twitch-api-smoky.vercel.app/twitch/...` (URL de Vercel directa)

---

## Estrategia de Caché

El sistema usa **tres niveles de caché** en cascada:

```
Request
   │
   ▼
┌──────────────────────────────────────────┐
│ L1: Memoria (Map)                        │
│ TTL: 30s-60s                             │
│ Máximo: 500-1000 entradas                │
│ Evicción: LRU-like (elimina 25% al      │
│           alcanzar el límite)            │
└──────────────┬───────────────────────────┘
               │ miss
               ▼
┌──────────────────────────────────────────┐
│ L2: Vercel KV (Redis)                    │
│ TTL: 60s (API users), 24h (user IDs)    │
│ Consistente entre instancias serverless  │
│ Almacena usuarios completos (StoredUser) │
└──────────────┬───────────────────────────┘
               │ miss
               ▼
┌──────────────────────────────────────────┐
│ L3: Supabase (PostgreSQL)               │
│ Fuente de verdad                         │
│ Resultado se escribe en L2 y L1          │
└──────────────────────────────────────────┘
```

### Técnicas avanzadas de caché

1. **Request Coalescing** (`authMiddleware.ts:23`): Si dos requests simultáneos piden el mismo usuario a la BD, comparten la misma promesa. Evita el problema N+1 en ráfagas.

2. **Caché Negativa** (`apiKeyValidator.ts:15-16`): API keys inválidas se bloquean por 30s sin consultar la BD. Mitiga ataques de fuerza bruta.

3. **Deduplicación KV** (`cacheService.ts:35-64`): Si dos requests piden la misma clave KV, la segunda espera la promesa de la primera.

4. **Throttle de operaciones costosas** (`authMiddleware.ts:19-21`, `activityService.ts:5-7`): `updateLastActive` solo se ejecuta cada 5 min. `trimUserLogs` cada 60s.

### ¿Por qué no usar solo KV?

Vercel KV es rápido (~1ms en edge) pero:

- Tiene costo por operación
- Los datos pueden ser efímeros (aunque son persistentes)
- La latencia de red suma en cold starts

La caché L1 en memoria es instantánea (0ms) y gratuita. El tradeoff es que no se comparte entre instancias.

---

## Autenticación y Autorización

### Flujo OAuth

```
1. Usuario hace clic en "Login con Twitch"
2. GET /auth/twitch → authController.login()
   - Genera state firmado con HMAC-SHA256(client_secret)
   - Redirige a id.twitch.tv/oauth2/authorize
3. Twitch redirige a /auth/twitch/callback?code=xxx&state=xxx
4. authController.callback()
   - Verifica firma HMAC del state (previene CSRF)
   - Intercambia code por access_token + refresh_token
   - Obtiene perfil del usuario desde GET /helix/users
   - Genera o reutiliza API Key (UUID v4)
   - Encripta tokens con AES-256-CBC
   - Guarda usuario en Supabase
   - Redirige al dashboard con ?apiKey=xxx
```

### Doble sistema de autenticación

La API acepta dos métodos de autenticación:

| Método                                                           | Uso                                       | Rate Limit                                 | Validación                           |
| ---------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------ | ------------------------------------ |
| **API Key** (`?apiKey=xxx` o header `X-Api-Key`)                 | Comandos de bot (Nightbot), apps externas | Configurable por usuario (default: 60/min) | `apiKeyValidator.ts` → DB → KV       |
| **Token de sesión** (`?token=xxx` o `Authorization: Bearer xxx`) | Dashboard web                             | 1000/min                                   | `authMiddleware.ts` → Helix validate |

Ambos métodos se validan en cada request y pueblan `res.locals.apiUser` con el `StoredUser` completo. Si ambos están presentes, la API Key tiene precedencia.

### Refresh de tokens

- `refreshUserToken()` en `auth.service.ts` usa **request deduplication** (`refreshPromises` Map) para evitar que múltiples requests simultáneos refresquen el mismo token.
- Timeout de 15 segundos con `Promise.race`.
- Si el refresh falla pero el token aún no expiró, se usa el token actual.
- Si el refresh falla y el token expiró, se devuelve error pidiendo reautenticación.

### ¿Por qué encriptar los tokens de Twitch en la BD?

Supabase es seguro, pero encriptar los tokens añade una capa adicional: si hay una brecha en la BD, los access tokens no se pueden usar sin la clave de encriptación (que vive en variables de entorno, no en BD).

---

## Rate Limiting

### Arquitectura

```
Cliente → globalRateLimiter → KV Redis → Respuesta
                │
                ├─ API Key:     rl:api:{userId}:{ventana_minuto}
                ├─ Sesión:      rl:sess:{userId}:{ventana_minuto}
                └─ IP anónimo:  rl:ip:{ip}:{ventana_minuto}
```

| Tipo              | Límite                 | Ventana | Usa                |
| ----------------- | ---------------------- | ------- | ------------------ |
| API Key (default) | 60/min                 | 1 min   | Usuarios externos  |
| API Key (custom)  | Configurable por admin | 1 min   | Power users        |
| Sesión            | 1000/min               | 1 min   | Dashboard          |
| IP pública        | 1000/min               | 1 min   | Rutas públicas     |
| Login             | 5/15min                | 15 min  | Anti fuerza bruta  |
| Pesado (clips)    | 10/min                 | 1 min   | Endpoints costosos |

### ¿Por qué Vercel KV para rate limiting?

En serverless, cada invocación es una instancia nueva. Un rate limiter en memoria no funcionaría porque cada request vería un contador diferente. KV centraliza los contadores.

### Fail-closed

Si KV no está disponible, el rate limiter devuelve 503. Es preferible denegar servicio que permitir abuso sin límites.

---

## Resiliencia

### Circuit Breaker (`twitch.service.ts`)

```
Estado CLOSED → [5 fallos consecutivos] → OPEN (30s)
                                              │
                                              ▼
                                         HALF_OPEN
                                              │
                               ┌─ éxito ──────┴─ fallo ──┐
                               ▼                          ▼
                            CLOSED                      OPEN
```

- **Sincronización con KV**: El estado del circuit breaker se persiste en KV para que todas las instancias serverless compartan el mismo estado.
- **Notificación Discord**: Cuando se abre el circuit breaker, se envía un webhook a Discord.
- **Cold start**: Al arrancar, se consulta KV para restaurar el estado previo (sin await, para no bloquear).

### Retry con backoff exponencial

`axios-retry` configurado con 3 reintentos y backoff exponencial para errores de red, rate limiting (429), y errores retryables.

### Degradación graceful

- Si `getFollowersCount` falla, devuelve 0 (no rompe el dashboard).
- Si `getUserActivity` falla, devuelve array vacío.
- Si el refresh de token falla pero el token actual aún es válido, se usa el token actual.

---

## Seguridad

### Content Security Policy (CSP)

Se genera un **nonce único por request** (`cspNonce.ts` → `res.locals.cspNonce`) que se inyecta en:

1. Los headers CSP de Helmet
2. Los tags `<script>` del HTML servido

Esto permite ejecutar scripts inline sin usar `'unsafe-inline'`. Combinado con `'strict-dynamic'`, los scripts cargados dinámicamente con el nonce correcto también funcionan.

**Servido de HTML**: Toda página HTML se sirve a través de `serveHtml()` (`src/core/utils/serveHtml.ts`), que:

- Lee el archivo HTML del disco solo la primera vez y lo guarda en un `Map<string, string>` en memoria (caché de templates).
- Reemplaza `{{cspNonce}}` con el nonce del request actual usando regex.
- Elimina `res.sendFile()` completo — todo HTML pasa por este pipeline.
- Los archivos estáticos del admin solo sirven `.js` y `.css`, no `.html`, lo que previene servir HTML sin nonce.

### Encriptación de tokens

- Algoritmo: AES-256-CBC con IV aleatorio por token
- Formato: `{iv_hex}:{ciphertext_hex}`
- Clave derivada: `SHA256(ENCRYPTION_KEY)` — independiente de otras claves
- **Legacy fallback**: Clave derivada de `TWITCH_CLIENT_SECRET` para tokens antiguos, con migración **bajo demanda** solo cuando se detecta cifrado con clave legacy (`decryptAndMigrateIfNeeded`). La migración solo ocurre una vez por usuario; los requests subsecuentes con la clave primaria no ejecutan `saveUser` ni invalidan caché.

### Sanitización

- **Logs**: API keys, tokens, y contraseñas se redactan en logs (Winston formatter).
- **Comandos de chat**: Las respuestas pasan por `sanitizeHtml()` para prevenir XSS.
- **URLs en logs**: Parámetros sensibles en query strings se reemplazan con `[REDACTED]`.

### Decisiones

| Decisión                               | Alternativa rechazada      | Motivo                                                                                         |
| -------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------- |
| Nonces CSP dinámicos                   | `'unsafe-inline'` global   | Mejor seguridad sin sacrificar funcionalidad                                                   |
| AES-256-CBC para tokens                | AES-256-GCM                | Compatibilidad con datos legacy en formato `iv:encrypted`                                      |
| `SERVICE_ROLE_KEY` en backend          | Cliente anónimo + RLS      | Necesario para operaciones administrativas (CRUD de usuarios)                                  |
| `localOnly` usa `socket.remoteAddress` | `req.ip` con `trust proxy` | `req.ip` puede ser spoofed vía `X-Forwarded-For`; `remoteAddress` es el IP real de la conexión |
| `serveHtml` para todo HTML             | `res.sendFile()`           | `sendFile` no inyecta nonce CSP; `serveHtml` cachea templates y reemplaza `{{cspNonce}}`       |
| 404 en lugar de 403 para admin routes  | 403 Forbidden              | No revelar que la ruta existe                                                                  |

---

## Base de Datos

### Esquema (Supabase/PostgreSQL)

```
users
├── user_id (PK, text)
├── login, display_name
├── access_token, refresh_token (encrypted)
├── api_key (UUID, unique)
├── is_active, blocked_reason
├── custom_rate_limit
├── profile_image_url, timezone
├── last_active, created_at

user_stats (1:1 con users)
├── user_id (FK)
├── total_requests, total_errors, total_latency
├── clips_count, followage_count, so_count
├── stalker_count, trends_count, roulette_count
├── message_count, russian_count, magic8_count, duel_count

activity_logs
├── id (PK)
├── user_id (FK → users)
├── activity_type, user_name, detail
├── created_at

admins
├── user_id (PK, FK → users)

system_logs
├── id (PK)
├── level, message, details (JSONB)
├── created_at
```

### Decisiones

| Decisión                                  | Motivo                                                             |
| ----------------------------------------- | ------------------------------------------------------------------ |
| `user_id` como `text` no `uuid`           | Los IDs de Twitch son strings numéricos, no UUIDs                  |
| Tokens encriptados en BD                  | Defense in depth: brecha de BD no expone tokens                    |
| `user_stats` como tabla separada          | Separación de concerns; evita mezclar datos de perfil con métricas |
| JOIN en `getAllUsers()`                   | Una sola query en vez de N+1 consultas individuales                |
| `activity_logs` con límite 50 por usuario | Evita crecimiento ilimitado; trim automático con throttle          |

---

## Frontend

### Arquitectura

El frontend es **TypeScript vanilla** compilado con esbuild. No usa React, Vue, ni ningún framework de UI.

```
frontend/
├── core/
│   ├── auth.ts           # Login/logout, gestión de sesión
│   ├── dashboard.ts      # Orquestador de tabs y módulos
│   ├── dashboardStore.ts # Estado compartido entre módulos
│   ├── realtimeService.ts # Conexión Supabase Realtime
│   ├── store.ts          # Estado global simple
│   ├── ui-core.ts        # Utilidades de UI
│   └── ui.ts             # Componentes de UI base
├── features/dashboard/
│   ├── account/          # Perfil de usuario, exportación de datos
│   ├── commands/         # Configuración de comandos para Nightbot
│   ├── clips/            # Búsqueda y visualización de clips
│   ├── duel/             # Interfaz de duelo
│   ├── magic8/           # Bola 8 mágica
│   ├── roulette/         # Ruleta de chatters
│   ├── russian/          # Ruleta rusa
│   ├── stalker/          # Stalker (chatters online)
│   ├── trends/           # Tendencias
│   └── feedback/         # Formulario de feedback
└── shared/
    ├── components/       # Header, footer, toasts, modales
    ├── i18n/             # Mensajes traducidos
    └── utils/            # API cache, errores, templates
```

### Patrón de módulos

Cada pestaña del dashboard es un **módulo** con interfaz:

```typescript
interface DashboardModule {
    name: string;
    initialized: boolean;
    init(session: Session): void;
    activate(): void; // Llamado al cambiar a esta pestaña
    deactivate(): void; // Llamado al salir de esta pestaña
}
```

Los módulos se cargan perezosamente: el HTML se obtiene vía `HtmlLoader` y los módulos se inicializan solo cuando el usuario visita la pestaña por primera vez.

### ¿Por qué vanilla TypeScript en vez de React/Vue?

1. **Bundle size mínimo**: El JS compilado pesa ~50KB vs ~150KB+ con React.
2. **Sin dependencies**: No hay que mantener versiones de framework, breaking changes, etc.
3. **Control total del DOM**: Para un dashboard con animaciones y efectos visuales (Lenis smooth scroll), manipular el DOM directamente da más control.
4. **Serverless-friendly**: Menos JS = menos cold start en el navegador.

---

## Decisiones de Diseño

### 1. ¿Por qué Express 5 en vez de Fastify/Hono?

Express es el ecosistema más maduro con tipados completos. Express 5 (lanzado 2024) trae soporte nativo de async/await en middlewares. Para una API de este tamaño, la diferencia de rendimiento con Fastify es negligible (<10% en benchmarks) y la familiaridad del equipo pesa más.

### 2. ¿Por qué Zod en vez de Yup/TypeBox?

- Zod 4 tiene mejor inferencia de tipos y API más ergonómica.
- `safeParseAsync` permite validar objetos complejos (body + query + params).
- Mejor integración con TypeScript `strict: true`.

### 3. ¿Por qué `commonjs` en vez de ESM para el backend?

Vercel tiene mejor soporte para CommonJS en funciones serverless. Algunas dependencias (`winston`, `jsonwebtoken`) tenían problemas con ESM en el momento de la decisión. La migración a ESM está en el roadmap.

### 4. ¿Por qué esbuild para el frontend pero `tsc` para el backend?

- **Backend**: `tsc` es suficiente (pocos archivos, sin bundling necesario). Vercel soporta CommonJS nativamente.
- **Frontend**: esbuild es 100x más rápido que `tsc` y produce bundles optimizados (tree-shaking, minificación). Sin esbuild, el frontend tendría cientos de archivos JS separados.

### 5. ¿Por qué `SERVICE_ROLE_KEY` para todo el backend?

El cliente de Supabase con `SERVICE_ROLE_KEY` bypassa Row Level Security. Esto es necesario porque:

- El backend necesita leer/escribir usuarios independientemente de quién está autenticado
- Las operaciones de registro de actividad y estadísticas no tienen un "usuario autenticado" de Supabase
- Simplifica la lógica de permisos (todo se maneja en el middleware de la API)

### 6. ¿Por qué mensajes de error en español?

El público objetivo son streamers hispanohablantes. Los mensajes de error son la interfaz de usuario para comandos de chat (Nightbot muestra el texto literal).

### 7. ¿Por qué no hay migraciones de BD?

El schema de Supabase se gestiona manualmente vía el dashboard de Supabase. Para un proyecto de este tamaño, las migraciones automatizadas añadirían complejidad sin beneficio claro. El archivo `docs/database_backup.sql` sirve como respaldo del schema.

---

## Roadmap Técnico

- [ ] Migrar backend a ESM (cuando las dependencias lo soporten)
- [ ] Dividir `twitch.service.ts` en servicios especializados
- [ ] Añadir tests para servicios de juegos y circuit breaker
- [ ] Migrar `tmi.min.js` a EventSub (WebSockets) cuando Twitch depreque IRC
- [ ] Implementar hot-reload para desarrollo
- [ ] Cacheo de respuestas de comandos de chat (followage, shoutout) con invalidation inteligente
- [ ] Dashboard PWA completo con notificaciones push
