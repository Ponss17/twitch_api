# 🚀 Backlog de Mejoras Futuras - LosPerris Twitch API

Este documento contiene la lista detallada de mejoras técnicas y funcionalidades pendientes para futuras sesiones.

---

## 🏗️ 1. Refactorización a Arquitectura Reactiva (Alta Prioridad)

Ya hemos migrado el **HomeModule** al nuevo `dashboardStore.ts`. Falta completar la migración de los siguientes módulos para que el frontend sea 100% robusto y fácil de mantener:

- [ ] **Módulo de Comandos:** Suscribir la lista de comandos al Store.
- [ ] **Módulo de Clips:** Manejar la carga y visualización de clips desde el estado central.
- [ ] **Módulo de Perfil (Cuenta):** Centralizar la gestión de API Keys y configuración de usuario.
- [ ] **Módulos de Herramientas (Stalker/Trends):** Hacer que el estado de carga y los resultados vivan en el Store.
- [ ] **Módulo de Minijuegos:** Sincronizar resultados de juegos en tiempo real.

---

## ⚡ 2. Tiempo Real (Supabase Realtime)

Para eliminar el _polling_ (peticiones cada 30 segundos) y hacer que el dashboard sea instantáneo:

- [ ] **Backend (JWT Generator):** Crear un endpoint que firme un token JWT usando el `SUPABASE_JWT_SECRET` para que el frontend pueda entrar a Supabase de forma segura.
- [ ] **Frontend (Listener):** Instalar `@supabase/supabase-js` en el frontend y configurar el canal de escucha para las tablas `activity_logs` y `user_stats`.
- [ ] **Store Sync:** Conectar las notificaciones de Supabase directamente con `dashboardStore.setState()`.

---

## 🛠️ 3. Infraestructura y DevOps

- [ ] **Logging Profesional:** Migrar el actual `logger.ts` a **Winston** o **Pino**. Esto permitirá tener niveles de log (`debug`, `info`, `warn`, `error`) y un formato JSON estructurado más fácil de leer en producción.
- [ ] **Monitoreo con Sentry:** Verificar la recepción de eventos una vez se configure el DSN de producción y añadir _source maps_ para ver el código original en los errores.
- [ ] **Semantic Release:** Configurar un pipeline que lea los mensajes de commit (`feat:`, `fix:`) para subir automáticamente la versión del proyecto y generar el `CHANGELOG.md`.

---

## 📡 4. Evolución de la API

- [ ] **API Versioning:** Implementar el prefijo `/v1/` en todas las rutas de Express para asegurar que cambios futuros no rompan los bots de los usuarios (Nightbot, StreamElements, etc.).
- [ ] **Swagger/OpenAPI:** Generar una página de documentación interactiva donde los usuarios puedan probar los endpoints directamente desde el navegador.

---

## 🎨 5. UI/UX

- [ ] **Micro-interacciones:** Añadir más animaciones sutiles cuando los datos cambian en el Store Reactivo.
- [ ] **Notificaciones Toast:** Implementar un sistema de avisos visuales (Toasts) para errores de red o acciones exitosas, conectado al Store.

---

© 2026 LosPerrisAPI - Documentación para el futuro.
