# 🧠 Contexto para Agentes IA (LosPerris Twitch API)

Este archivo sirve como memoria técnica para cualquier IA que trabaje en este repositorio.

## 📌 Resumen del Proyecto

API de Twitch personalizada que sirve de puente para bots de chat (Nightbot/StreamElements).

- **Versión Actual:** v4.0.0 (Calificación: 9.5/10)
- **Estado:** Producción (132 tests exitosos). 3 rondas de auditoría completadas, 0 bugs pendientes.
- **Stack:** Node.js (Express), TypeScript, Supabase (DB + Realtime), Redis/Vercel KV (Cache L1/L2), Vercel (Hosting).

## 🏗️ Arquitectura

- **Backend:** Modular por features (`src/features`). Middleware de validación con Zod.
- **Frontend:** Vanilla TS con carga dinámica de módulos. Sistema de estado reactivo en `dashboardStore.ts`.
- **Seguridad:** Modo estricto implementado. API Keys enmascaradas, RLS en Supabase, Rate Limiting por IP/sesión/API Key (4 niveles), CORS/CSRF centralizado en `origins.ts`, AsyncLocalStorage para correlación de logs, Circuit Breaker persistido en KV. Redirección automática al login ante cualquier fallo de autenticación.
- **Realtime:** WebSocket con Supabase, token refresh cada 4 min sin destruir conexión (solo `setAuth()`), espera adaptativa, singleton con detección de cambio de sesión.

## 🚦 Reglas de Oro

1. **Comentarios:** Siempre en español, solo para evitar errores de TS en archivos públicos.
2. **Commits:** Siempre en español.
3. **Base de Datos:** Siempre actualizar `docs/database_backup.sql` tras cambios en el esquema.
4. **Validación:** No realizar validaciones manuales; usar esquemas Zod en `*.schema.ts`.
5. **Comandos:** Usar `pnpm`.

## 📂 Archivos de Referencia

- `docs/API_REFERENCE.md`: Guía completa de endpoints.
- `docs/AUDITORIA_MASTER.md`: Resumen de seguridad y estabilidad.
- `docs/ROADMAP.md`: Tareas pendientes y backlog.
- `docs/database_backup.sql`: Esquema completo de BD, funciones, índices, RLS, políticas y configuración de Realtime.

---

_Última actualización: 5 Mayo 2026_
