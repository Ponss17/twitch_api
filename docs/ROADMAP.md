# 🗺️ Roadmap y Backlog de Desarrollo

Estado actual del proyecto: **v4.0.0 (Estable / Producción)**

---

## ✅ Completado (Mitos Logrados)

- [x] **Suite de Tests (132):** Cobertura total de la API.
- [x] **PWA Estabilizada:** Service Worker y manifest funcionales.
- [x] **Rate Limiter Pro:** Temporizador de 15 minutos persistente.
- [x] **Dashboard Store:** Arquitectura reactiva iniciada (Módulo Home).
- [x] **Sentry & CI/CD:** Monitoreo y validación automática configurados.

---

## 🚀 Próximos Pasos (Backlog Futuro)

### 1. Refactorización UI (Arquitectura Reactiva) ✅

- [x] **Notificaciones Toast:** Sistema de avisos visuales conectado al estado global.
    - ToastComponent conectado al dashboardStore
    - ToastActions para mostrar/ocultar toasts programáticamente
    - UI.showToast() ahora usa el sistema reactivo
- [x] **Migrar Módulos al Store:**
    - [x] ClipsModule: Completamente migrado al dashboardStore
    - [x] CommandsModule: Completamente migrado al dashboardStore
    - [x] ProfileModule: Completamente migrado al dashboardStore

### 2. Tiempo Real (Supabase Realtime) ✅

- [x] **JWT Generator:** Endpoint creado para dar acceso seguro al frontend.
    - `GET /api/twitch/system/realtime-token` - Genera token JWT firmado
    - Expiración de 5 minutos por seguridad
- [x] **Suscripción Directa:** Realtime implementado con fallback a polling.
    - `frontend/core/realtimeService.ts` - Servicio dedicado
    - Suscripción a tablas `activity_logs` y `user_stats`
    - Renueva token automáticamente cada 4 minutos
    - Fallback a polling si falla la conexión
    - Indicador visual 'Realtime' en el dashboard

### 3. Seguridad Frontend (Modo Estricto) ✅

- [x] **Validación Estricta de Sesión:** Eliminados fallbacks permisivos.
    - Sin credenciales válidas = Redirección inmediata al login
    - Sin userId en sesión = Redirección inmediata al login
    - Token expirado o inválido = Toast de error + Redirección
    - Evento `realtime:auth-failed` para manejo centralizado de errores 401
- [x] **Soporte Dual de Autenticación:** Realtime soporta token de Twitch o API Key.
    - Prioridad: Bearer token (autenticación principal)
    - Fallback: Header `x-api-key` (autenticación alternativa)
    - Verificación estricta antes de cualquier operación de realtime

### 4. Infraestructura y API

- [x] **Logging Estructurado:** Implementado con Winston.
    - Niveles de log configurables: error, warn, info, debug
    - Formato JSON estructurado en producción
    - Sanitización automática de datos sensibles (API keys, tokens)
    - Correlación de requests con ID único
    - Metadata contextual: requestId, userId, endpoint, duration, statusCode
    - Fallback a DB con circuit breaker para logs de error/warn
- [x] **JWT Generator:** Endpoint creado para acceso seguro a Supabase Realtime.
    - `GET /api/twitch/system/realtime-token` - Genera token JWT firmado
    - Expiración de 5 minutos por seguridad
    - Verificación de autenticación del usuario (token o API Key)
    - Payload con user_id, login, role='authenticated'
    - Modo estricto: 401 si no hay autenticación válida

- [ ] **Versionado v1:** Añadir prefijos a las rutas para mayor estabilidad.
- [ ] **Swagger Docs:** Documentación interactiva automática.

---

## 📈 Visión a Largo Plazo

- Integración de más minijuegos basados en LLM (Groq).
- Panel de administración avanzado para moderadores.
- Exportación de analíticas en PDF/CSV.

---

_Última actualización: 5 Mayo 2026_
