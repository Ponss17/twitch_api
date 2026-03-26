# Roadmap — LosPerris Twitch API

Cambios planeados para futuras versiones.

---

## ✅ Completado

### Optimización y Seguridad v2.9.5 🚀

- **Sincronización de Pestañas**: Liderazgo vía `BroadcastChannel` (90% menos tráfico redundante).
- **Blindaje de Privacidad (DLP)**: Filtro de seguridad en la API para evitar fugas de datos sensibles (como emails).
- **Hardening de Supabase**: RLS Activo en todas las tablas y protección de `search_path` en funciones SQL.
- **Backup Estructural**: Generado `database_backup.sql` para recuperación de desastres.

### Hash de actividad (Redis List nativo)

Migrado `addUserActivity` / `getUserActivity` a Redis List nativa (`LPUSH`, `LRANGE`). Eliminado el riesgo de race conditions en logs.

### Optimización de Frontend (Landing & About)

- Badges locales (0 requests externos).
- Cache-Control `immutable` para assets.
- Loop de partículas en `about.ts` pausado en idle (0% CPU en espera).

### Polling del Dashboard

- Sin cache-bust (`?_=Date.now()` eliminado).
- Pausado automáticamente cuando la pestaña está en background.
- Preload de tabs secuencial (sin ráfaga de requests).

### Rate limiting por endpoint costoso

- `/analytics`, `/chatters`, `/get-clips` limitados a **10 req/min** para API Key externa.
- Dashboard (sesión) sin cambios: 1000/min.

---

## 🔜 Próximo

- **Notificaciones de salud del sistema**: Alertas vía Discord/Webhooks cuando la latencia sube de un umbral.
- **Dashboard v3 (UI Refactor)**: Nuevos widgets de visualización y mejoras estéticas.

---

## 📅 Futuro

### Versionado de la API (`/v1/`)

Añadir prefijo de versión en las rutas para poder hacer cambios breaking en el futuro sin afectar a usuarios existentes.

---

© 2026 LosPerrisAPI.
