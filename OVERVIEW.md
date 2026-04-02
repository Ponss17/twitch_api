# LosPerris Twitch API — Visión General

API personalizada para integración con Twitch, diseñada para uso en streams en directo. Permite ejecutar comandos de chat, consultar estadísticas y gestionar clips, entre otras funciones.

---

## ¿Qué hace esta API?

Actúa de puente entre Twitch y herramientas externas como **Nightbot**, **StreamElements** o cualquier bot de chat. En lugar de interactuar directamente con la API oficial de Twitch (que requiere OAuth y tokens complejos), esta API simplifica el acceso a través de una **API Key propia** que se obtiene desde el Dashboard.

---

## Autenticación

Todas las peticiones requieren una **API Key** personal, que se incluye como parámetro en la URL:

```
?apiKey=TU_KEY
```

La API Key se obtiene iniciando sesión con Twitch en el Dashboard y se puede regenerar en cualquier momento desde la sección de perfil.

---

## Endpoints disponibles

### Comandos de Twitch

| Endpoint        | Método | Descripción                                      |
| --------------- | ------ | ------------------------------------------------ |
| `/followage`    | GET    | Tiempo que lleva un usuario siguiendo un canal   |
| `/create-clip`  | GET    | Crea un clip del canal especificado              |
| `/shoutout`     | GET    | Genera un mensaje de shoutout para otro streamer |
| `/send-message` | POST   | Envía un mensaje al chat del canal               |

#### Ejemplo — Followage en Nightbot

```
$(urlfetch https://www.losperris.dev/api/twitch/followage?channel=$(channel)&user=$(user)&apiKey=TU_KEY)
```

#### Ejemplo — Shoutout

```
$(urlfetch https://www.losperris.dev/api/twitch/shoutout?channel=$(channel)&touser=$(touser)&apiKey=TU_KEY)
```

Parámetro opcional `template` para personalizar el mensaje:

```
?template=¡Síguele a {user}! Estaba jugando {game}
```

---

### Minijuegos

| Endpoint             | Descripción                                 |
| -------------------- | ------------------------------------------- |
| `/minigames/magic8`  | Bola 8 Mágica con IA (parámetro `question`) |
| `/minigames/russian` | Ruleta Rusa (modo hardcore opcional)        |
| `/minigames/duel`    | Duelo entre dos usuarios del chat           |

#### Ejemplo — Bola 8 en Nightbot

```
$(urlfetch https://www.losperris.dev/api/twitch/minigames/magic8?question=$(1+)&user=$(user)&apiKey=TU_KEY)
```

---

### Dashboard

Acceso al panel de control personal en:

```
https://www.losperris.dev/api/twitch/dashboard
```

Desde el dashboard puedes ver:

- Estadísticas de uso (peticiones totales, por categoría, por día)
- Registro de actividad reciente
- Analíticas y métricas de rendimiento
- Gestión de tu API Key

---

### Estado del sistema

```
GET /api/twitch/health
```

Devuelve el estado actual de la API (operativo / mantenimiento) y la versión activa. Sin autenticación requerida.

---

## Restricciones

- Los nombres de usuario/canal deben ser **nombres válidos de Twitch** (solo letras, números y guion bajo, máximo 25 caracteres).
- Existe un **límite de peticiones por minuto** para evitar abusos. Los endpoints de análisis y chatters tienen límites más estrictos.
- Los mensajes de chat tienen un máximo de **500 caracteres**.
- Las preguntas a la Bola 8 tienen un máximo de **500 caracteres**.

---

## Tecnología

- **Backend:** Node.js + Express + TypeScript
- **Base de datos:** Supabase (PostgreSQL)
- **Caché:** Redis (Vercel KV)
- **Despliegue:** Vercel (entorno serverless)
- **Integración:** Twitch Helix API v2

---

© 2026 LosPerrisAPI — Uso privado.
