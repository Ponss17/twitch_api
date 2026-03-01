# Roadmap — LosPerris Twitch API

Cambios planeados para futuras versiones.

---

## 🔜 Próximo

### Tests unitarios

Añadir tests para los servicios críticos (`authService`, middleware de auth) para detectar regresiones automáticamente.

### Hash de actividad (Redis List nativo)

Migrar `addUserActivity` / `getUserActivity` del Mega Hash a una Redis List nativa (`LPUSH`, `LRANGE`, `LTRIM`) para eliminar el último punto de race condition.

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

- Rate limiting por endpoint específico (rutas costosas como `/analytics`)
- Notificaciones push (webhook) cuando la API supera un umbral de errores
