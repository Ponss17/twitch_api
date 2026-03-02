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

---

## 🔜 Próximo

### Tests unitarios (En progreso: 77/77 OK)

Seguir ampliando la cobertura de tests, especialmente en la lógica de `authService`.

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

## 💡 Ideas

### Rate limiting por endpoint específico

No todos los endpoints "cuestan" lo mismo. El plan es asignar límites distintos según la carga que generen:

- **Rutas Ligeras (Ej: `!followage`, `!user`):** Límites altos (Ej: 100 req/min). Son consultas rápidas a Redis.
- **Rutas Pesadas (Ej: `!analytics`, `!stalker`):** Límites bajos (Ej: 10 req/min). Requieren procesar más datos o hacer múltiples llamadas a Twitch.
- **Rutas Críticas (Ej: `/auth`, `/regenerate-key`):** Límites muy estrictos por seguridad.

### Notificaciones de salud del sistema

Notificaciones push o Webhooks cuando la latencia sube de un umbral o el ratio de errores 5xx aumenta.
