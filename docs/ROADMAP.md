# 🗺️ Roadmap y Backlog de Desarrollo

Estado actual del proyecto: **v4.0.0 (Estable / Producción)**

---

## ✅ Completado (Mitos Logrados)

- [x] **Suite de Tests (128):** Cobertura total de la API.
- [x] **PWA Estabilizada:** Service Worker y manifest funcionales.
- [x] **Rate Limiter Pro:** Temporizador de 15 minutos persistente.
- [x] **Dashboard Store:** Arquitectura reactiva iniciada (Módulo Home).
- [x] **Sentry & CI/CD:** Monitoreo y validación automática configurados.

---

## 🚀 Próximos Pasos (Backlog Futuro)

### 1. Refactorización UI (Arquitectura Reactiva)

- [ ] **Migrar Módulos:** Pasar Clips, Comandos y Perfil al `dashboardStore.ts`.
- [ ] **Notificaciones Toast:** Sistema de avisos visuales conectado al estado global.

### 2. Tiempo Real (Supabase Realtime)

- [ ] **JWT Generator:** Crear endpoint para dar acceso seguro al frontend.
- [ ] **Suscripción Directa:** Eliminar polling en el dashboard.

### 3. Infraestructura y API

- [ ] **Logging Estructurado:** Aprovechar Winston (ya instalado) para implementar niveles de log y formato JSON en producción.
- [ ] **Versionado v1:** Añadir prefijos a las rutas para mayor estabilidad.
- [ ] **Swagger Docs:** Documentación interactiva automática.

---

## 📈 Visión a Largo Plazo

- Integración de más minijuegos basados en LLM (Groq).
- Panel de administración avanzado para moderadores.
- Exportación de analíticas en PDF/CSV.

---

_Última actualización: Mayo 2026_
