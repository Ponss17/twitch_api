# Auditoría Técnica Detallada: Sesiones y Cold Starts (23 de Junio, 2026)

Este documento contiene un desglose técnico exhaustivo de los tres problemas críticos de experiencia de usuario (UX) y autenticación resueltos en el repositorio principal (`twitch_api`). Estos problemas afectaban el frontend (React/Astro) y el backend (Node.js/Express) bajo el entorno de despliegue Serverless de Vercel.

---

## 1. Persistencia de Sesión en Nuevas Pestañas (Cross-Origin)

### Contexto Técnico
El sistema utiliza `localStorage` para persistir la sesión entre recargas de página. Al hacer el inicio de sesión OAuth con Twitch, el backend redirige al frontend pasando el origen de la redirección. 

### El Problema
Al abrir una nueva pestaña desde `https://www.losperris.dev/api/twitch/dashboard`, el navegador no lograba recuperar la sesión activa. El sistema consideraba al usuario como no autenticado y lo redirigía inmediatamente a la Landing Page.

### Causa Raíz
En el archivo `src/lib/auth.ts`, existía una lógica que mutaba el origen de la redirección eliminando el subdominio `www.`. 
Debido a las políticas de seguridad del navegador (Same-Origin Policy), el `localStorage` está aislado por subdominio. Al guardar la sesión como perteneciente a `losperris.dev`, cualquier intento de leerla desde `www.losperris.dev` devolvía `null`.

### Código Modificado
**Archivo:** `src/lib/auth.ts`

**Antes:**
```typescript
let redirectOrigin = window.location.origin;
redirectOrigin = redirectOrigin.replace('www.', ''); // Error: rompía la consistencia del origen
```

**Después:**
```typescript
// Se eliminó la mutación del dominio
let redirectOrigin = window.location.origin;
```

**Impacto:**
La sesión ahora respeta estrictamente el origen exacto (FQDN) desde el cual se autenticó el usuario. El `SessionProvider` ahora puede encontrar exitosamente el token en el `localStorage` al abrir múltiples pestañas bajo el mismo subdominio.

---

## 2. Experiencia de Usuario: Modal de Verificación "Fugaz"

### Contexto Técnico
Para validar la sesión rápidamente sin bloquear la interfaz, el frontend implementa una caché en `sessionStorage` que guarda la última validación por 5 minutos (`VALIDATE_TTL_MS`).

### El Problema
El modal de carga (`<VerifyingSessionModal />`) que contiene la animación de la barra de progreso (`splashProgress`) desaparecía casi instantáneamente (en ~50ms). Esto provocaba un parpadeo visual molesto antes de cargar el Dashboard, arruinando la experiencia "premium" de carga esperada.

### Causa Raíz
Dado que la caché en memoria responde de forma síncrona/instantánea, la variable de estado `loading` en el `SessionProvider` pasaba a `false` en milisegundos. En `DashboardApp.tsx`, el evento `home:data-ready` se disparaba instantáneamente y cambiaba la propiedad `done` del modal a `true`. Esto forzaba a la barra de progreso a saltar al 100% (omitiendo la animación CSS de 3 segundos) e iniciando el *fade-out*.

### Código Modificado
**Archivo:** `src/components/DashboardApp.tsx`

**Lógica Implementada:**
Se añadió un temporizador inteligente que calcula cuánto tiempo ha estado visible el modal y asegura un tiempo de permanencia mínimo de 2 segundos (2000 ms).

```typescript
// Escuchar cuando el Home ya cargó los datos
useEffect(() => {
    if (!splashOpen) return;

    const startTime = Date.now();
    const onReady = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 2000 - elapsed); // Asegura al menos 2s
        setTimeout(() => setSplashDone(true), remaining);
    };
    window.addEventListener('home:data-ready', onReady);

    // Safety fallback
    const fallback = setTimeout(() => setSplashDone(true), 6000);

    return () => {
        window.removeEventListener('home:data-ready', onReady);
        clearTimeout(fallback);
    };
}, [splashOpen]);
```

**Impacto:**
El modal ahora permanece en pantalla el tiempo suficiente para que la animación fluida de la barra colorida de progreso se ejecute, mejorando drásticamente la percepción de calidad y pulido del aplicativo.

---

## 3. Expulsiones (Logouts) Inesperados por Cold Starts (Vercel)

### Contexto Técnico
La plataforma está hosteada en Vercel utilizando Serverless Functions. Al hacer un nuevo *deploy* (commit), Vercel descarta las instancias antiguas en memoria y levanta nuevas (*Cold Start*).

### El Problema
Los desarrolladores y usuarios activos reportaron que "cada vez que commiteamos, el sistema nos cierra la sesión y hay que loguearse de nuevo". 

### Causa Raíz
Durante un *Cold Start*, las primeras peticiones del backend (`twitch_api/backend`) hacia la base de datos (Supabase) o la API de Twitch sufren una latencia significativa, lo que a menudo resulta en un *Timeout* o excepción de red (ej. `ECONNABORTED`).

La lógica de validación de tokens en los middlewares del backend carecía de diferenciación entre "Errores de Autenticación Reales" y "Errores de Red Transitorios".

1. **`apiKeyValidator.ts`**: Al fallar la consulta `dbService.getUser(userId)` por un *timeout*, el bloque `catch` asumía ciegamente que la API Key era inválida. Acto seguido, **añadía la clave a una lista negra (`invalidKeysCache`) por 30 segundos** y devolvía un código `HTTP 401 Unauthorized`.
2. **`system.controller.ts`**: Del mismo modo, si la validación de un token contra Twitch o el refresco mediante API Key fallaba por timeout, el controlador devolvía `HTTP 401`.

Al recibir un `401`, el frontend (`SessionProvider` en `src/lib/auth.ts`) reaccionaba asumiendo que los permisos del usuario habían sido revocados permanentemente, por lo que procedía a eliminar el token local y redirigir a `/`.

### Código Modificado
Se introdujo manejo de errores semántico en el backend para distinguir explicitly los códigos de estado y responder con `HTTP 503 Service Unavailable` en caso de latencia/caída.

**Archivo 1:** `backend/src/core/middleware/apiKeyValidator.ts`
```typescript
    } catch (e) {
        const error = e as Error;
        // Solo lista negra si es un error real de auth
        const isAuthError = error.message.includes('inválid') || error.message.includes('expirad');

        if (apiKey && isAuthError) {
            invalidKeysCache.set(apiKey);
        }

        const errorMsg = error.message.includes('Sesión expirada')
            ? error.message
            : isAuthError 
                ? 'Error de autenticación. Clave API inválida.'
                : 'Servicio no disponible temporalmente (timeout).';

        // ...
        // Se devuelve 401 si es inválido, o 503 si es problema de red
        return res.status(isAuthError ? 401 : 503).json({ error: errorMsg });
    }
```

**Archivo 2:** `backend/src/features/system/system.controller.ts` (Refresco con API Key)
```typescript
            } catch (err) {
                const errorMsg = (err as Error).message;
                const isAuthError = errorMsg.includes('inválid') || errorMsg.includes('expirad');
                
                if (isAuthError) {
                    return res.status(401).send(MESSAGES.AUTH.INVALID_TOKEN);
                } else {
                    return res.status(503).json({ error: 'Red inestable validando API Key', offline: true });
                }
            }
```

**Impacto:**
El frontend (`src/lib/auth.ts`) ya estaba programado para manejar códigos `503` asignando la bandera `networkError: true`. Ahora, cuando Vercel hace un *Cold Start* y el backend no logra comunicarse rápidamente con la DB o Twitch, devuelve un `503`. El frontend detecta la red inestable, muestra un *toast* de advertencia de "Conexión inestable", pero **mantiene la sesión viva**. Cuando el usuario intenta de nuevo unos segundos después, el contenedor de Vercel ya está caliente y la petición tiene éxito. Se erradicaron los logouts accidentales.
