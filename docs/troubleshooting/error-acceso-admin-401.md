# Gestión del Panel de Administración

El panel de administración es una herramienta crítica para gestionar usuarios y resolver problemas de acceso.

## 1. Acceso y Seguridad

- **Local Only**: Por diseño, el panel está configurado para ser accesible solo desde `localhost` (verifica `req.socket.remoteAddress` en vez de `req.ip` para evitar spoofing con proxies).
- **Autenticación**: Requiere la `ADMIN_PASSWORD` definida en el archivo `.env`.
- **Middleware**: Las rutas de admin están excluidas de la validación global de Twitch para evitar bloqueos por tokens expirados del administrador.
- **CSP Nonce**: Los archivos HTML del admin (`login.html`, `dashboard.html`) usan `{{cspNonce}}` como placeholder que se inyecta dinámicamente por request vía la utilidad `serveHtml()`.

## 2. Resolución de Problemas Comunes

### Error 401 en el Login Admin

- Causa: El middleware de autenticación de Twitch está interceptando la petición.
- Solución: Verificar que las rutas de `adminRouter` estén montadas **antes** del middleware `checkToken` en `routes.ts`.

### Error 500 al Resetear Keys

- Causa: Fallo en la comunicación con Redis al intentar borrar la caché.
- Solución: Ya mitigado con la política de resiliencia (Fail-soft). El servidor ahora ignora el fallo de Redis y completa el reset en la base de datos.

### Usuario con "Sesión Expirada" en Nightbot

- Causa: Token de Twitch roto por cambio de encriptación.
- Solución:
    1. Pedir al usuario que inicie sesión en la web.
    2. O usar la herramienta de administración para "Resetear Key" (esto fuerza la re-encriptación del token).

### Scripts bloqueados por CSP en páginas de error

- Causa: Los archivos `404.html`, `429.html` y `500.html` usan `nonce="{{cspNonce}}"` en sus scripts, pero si se sirven con `sendFile()` en vez de `serveHtml()`, el nonce no se reemplaza.
- Solución: Toda página HTML que contenga `{{cspNonce}}` debe servirse con `serveHtml()` (utilidad en `src/core/utils/serveHtml.ts`), no con `res.sendFile()`.
