# Resiliencia y Caché de Infraestructura

El sistema utiliza una arquitectura de caché de dos niveles (L1 y L2) diseñada para resistir fallos de servicios externos.

## 1. Niveles de Caché

- **L1 (Memoria Local)**: Un `Map` en Node.js que guarda los resultados de las API Keys durante 30-60 segundos. Es extremadamente rápido pero volátil.
- **L2 (Vercel KV / Redis)**: Persistencia de caché compartida entre instancias de servidor.

## 2. Política de Resiliencia (Fail-Soft)

El servidor está configurado para nunca colapsar si Redis/KV falla.

- **Bloques Try/Catch**: Todas las operaciones de caché están protegidas.
- **Fallback a Base de Datos**: Si Redis no responde (ej. error 500, timeout, o falta de permisos), el sistema simplemente devuelve `null` en la caché y procede a buscar la información directamente en Supabase.
- **Desarrollo Local**: En local, si no hay conexión a KV, el Rate Limiter global se desactiva automáticamente para permitir el desarrollo.

## 3. Consistencia de Datos (Invalidación)

Para evitar que los usuarios vean datos obsoletos después de loguearse:

- Cualquier llamada a `saveUser` invalida automáticamente la caché de la `userId`, el `login` y la `apiKey`.
- Sin embargo, `saveUser` **solo se ejecuta cuando hay una migración real de token** (usuario cifrado con llave legacy que necesita re-encriptación). Ya no se llama en cada request, lo que elimina operaciones innecesarias de escritura en Supabase y borrado de caché L1+L2.
- Esto garantiza que los cambios en los tokens de Twitch se reflejen en los comandos de Nightbot en menos de 1 segundo, **sin overhead en requests normales**.
