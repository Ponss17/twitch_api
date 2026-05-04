# 🧠 Contexto para Agentes IA (LosPerris Twitch API)

Este archivo sirve como memoria técnica para cualquier IA que trabaje en este repositorio.

## 📌 Resumen del Proyecto

API de Twitch personalizada que sirve de puente para bots de chat (Nightbot/StreamElements).

- **Versión Actual:** v4.0.0
- **Estado:** Producción (128 tests exitosos).
- **Stack:** Node.js (Express), TypeScript, Supabase (DB), Redis (Cache), Vercel (Hosting).

## 🏗️ Arquitectura

- **Backend:** Modular por features (`src/features`). Middleware de validación con Zod.
- **Frontend:** Vanilla TS con carga dinámica de módulos. Sistema de estado reactivo en `dashboardStore.ts`.
- **Seguridad:** API Keys enmascaradas, RLS en Supabase, Rate Limiting por IP y por API Key.

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
- `docs/database_backup.sql`: Esquema actual de la base de datos.

---

_Última actualización: Mayo 2026_
