# Roadmap — LosPerris Twitch API

Cambios planeados para futuras versiones.

---

## ✅ Completado

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
- Comandos y minijuegos sin cambios: 120/min.

### Tests unitarios (95/95 OK)

- Cobertura ampliada en `authService` (casos de error y regeneración).
- Cobertura completa de `dbService` (stats atómicas, Redis Lists v2, auditoría).
- Pruebas reales para el middleware de `rateLimiter` (heavyLimiter).

---

## 🔜 Próximo

_Pendiente de priorizar nuevas tareas._

---

## 📅 Futuro

### Versionado de la API (`/v1/`)

Añadir prefijo de versión en las rutas para poder hacer cambios breaking en el futuro sin afectar a usuarios existentes. Las URLs actuales seguirán funcionando como alias de `/v1/`.

```
/api/twitch/followage    → sigue funcionando (alias)
/api/twitch/v1/followage → nueva URL canónica
/api/twitch/v2/followage → versión futura con cambios
```

---

### Notificaciones de salud del sistema

Notificaciones push o Webhooks cuando la latencia sube de un umbral o el ratio de errores 5xx aumenta.
