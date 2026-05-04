# Roadmap — LosPerris Twitch API

Cambios planeados para futuras versiones y registro de lo ya completado.

---

## ✅ Completado (Estado 10/10 - Mayo 2026)

### Optimizaciones de Rendimiento y CI/CD

- **GitHub Actions (CI/CD)**: Pipeline automático para `eslint`, `type-check` y `jest` en cada push.
- **Preload y Lazy Loading**: Optimización de fuentes de Google e imágenes para mejor LCP.
- **PWA (Progressive Web App)**: Service Worker dinámico, caché robusta con rutas relativas, manifest instalable y página de fallback `offline.html`.

### Estabilidad y Seguridad (Hardening)

- **Manejo de Errores (Error Boundaries)**: Módulos del frontend aislados para evitar colapsos en cascada.
- **Sentry Logging**: Integrado en backend para rastrear errores no controlados.
- **Rate Limiting UI**: Página `429.html` con temporizador reactivo (`localStorage`) para gestionar cooldowns de 15 minutos en bloqueos de seguridad.
- **Pruebas de Integración (Supertest)**: Verificación de rutas críticas, middlewares y rate limiters (128 tests al 100%).

### Optimizaciones Previas (v2.9.5)

- **Sincronización de Pestañas**: Liderazgo vía `BroadcastChannel` (90% menos tráfico).
- **Blindaje de Privacidad (DLP)**: Filtro de seguridad en la API.
- **Hash de actividad**: Migrado a Redis List nativa (`LPUSH`, `LRANGE`).
- **Hardening de Supabase**: RLS Activo y `database_backup.sql`.

---

## 📅 Futuro / Backlog

### 1. Migración Total de la UI al Store Reactivo

Refactorizar todos los módulos visuales para que escuchen pasivamente los cambios de estado en `dashboardStore.ts`, eliminando `document.getElementById` sueltos.

### 2. Versionado Semántico de la API (`/v1/`, `/v2/`)

Añadir prefijo de versión en las rutas para poder hacer cambios breaking en el futuro sin afectar a los usuarios actuales de la API pública.

### 3. Documentación Interactiva (OpenAPI / Swagger)

Implementar Swagger-UI para pruebas directas desde el navegador.

### 4. Automatización del Changelog (Semantic Release)

Generación automática de release notes basada en los commits.

---

© 2026 LosPerrisAPI. Calidad y Seguridad ante todo.
