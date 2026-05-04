# LosPerris Twitch API

### Documentación de Referencia — v2.9.4

> API personalizada de integración con Twitch, diseñada para uso en streams en directo.
> Desplegada en infraestructura serverless con alta disponibilidad.

---

## Índice

1. [¿Qué es esta API?](#qué-es-esta-api)
2. [Autenticación](#autenticación)
3. [Comandos de Twitch](#comandos-de-twitch)
4. [Minijuegos](#minijuegos)
5. [Dashboard](#dashboard)
6. [Estado del sistema](#estado-del-sistema)
7. [Límites y restricciones](#límites-y-restricciones)
8. [Respuestas de error](#respuestas-de-error)
9. [Integración con bots de chat](#integración-con-bots-de-chat)
10. [Stack técnico](#stack-técnico)

---

## ¿Qué es esta API?

Actúa de puente entre Twitch y herramientas externas como **Nightbot**, **StreamElements** o cualquier bot de chat personalizado. En lugar de interactuar directamente con la API oficial de Twitch — que requiere OAuth, tokens y una infraestructura compleja — esta API simplifica todo a través de una sola **API Key personal**.

**Casos de uso típicos:**

- Comando `!followage` que muestra cuánto tiempo lleva un usuario siguiendo el canal
- Comando `!so` que genera un shoutout bonito para otro streamer con su juego actual
- Bola 8 mágica con inteligencia artificial integrada
- Ruleta rusa o duelo entre usuarios del chat
- Creación de clips automáticos durante el stream

---

## Autenticación

Todas las peticiones autenticadas requieren una **API Key personal** incluida como parámetro en la URL:

```
?apiKey=tu_api_key_aqui
```

| Método    | Cómo obtenerla                                                               |
| --------- | ---------------------------------------------------------------------------- |
| Dashboard | Inicia sesión con Twitch en `https://www.losperris.dev/api/twitch/dashboard` |
| Regenerar | Disponible en la sección de perfil del dashboard en cualquier momento        |

> **Importante:** La API Key es personal e intransferible. No la compartas públicamente.

---

## Comandos de Twitch

Base URL: `https://www.losperris.dev/api/twitch`

---

### `GET /followage`

Devuelve el tiempo que lleva un usuario siguiendo un canal concreto.

**Parámetros:**

| Parámetro  | Tipo   | Requerido | Descripción                          |
| ---------- | ------ | --------- | ------------------------------------ |
| `channel`  | string | ✅        | Login del canal (ej. `ponss17`)      |
| `user`     | string | ✅        | Login del usuario a consultar        |
| `template` | string | ❌        | Plantilla de respuesta personalizada |
| `apiKey`   | string | ✅        | Tu API Key personal                  |

**Variables disponibles en `template`:**

| Variable    | Valor                        |
| ----------- | ---------------------------- |
| `{time}`    | Tiempo formateado en español |
| `{user}`    | Nombre del usuario           |
| `{channel}` | Nombre del canal             |

**Respuesta de ejemplo:**

```
Ponss lleva 2 años, 3 meses y 5 días siguiendo a ponss17
```

**Con template personalizado:**

```
?template={user} lleva {time} en el canal de {channel} 🎉
```

---

### `GET /shoutout`

Genera un mensaje de shoutout para otro streamer con su juego actual en directo.

**Parámetros:**

| Parámetro  | Tipo   | Requerido | Descripción                         |
| ---------- | ------ | --------- | ----------------------------------- |
| `channel`  | string | ✅        | Tu canal (ej. `ponss17`)            |
| `touser`   | string | ✅        | Canal al que se hace el shoutout    |
| `template` | string | ❌        | Plantilla personalizada del mensaje |
| `apiKey`   | string | ✅        | Tu API Key personal                 |

**Variables disponibles en `template`:**

| Variable | Valor                              |
| -------- | ---------------------------------- |
| `{user}` | Nombre del canal del shoutout      |
| `{game}` | Juego que está jugando actualmente |
| `{url}`  | URL del canal en Twitch            |

**Respuesta de ejemplo:**

```
¡Vayan a seguir a @ibai! Estaba jugando Just Chatting → https://twitch.tv/ibai
```

---

### `GET /create-clip`

Crea un clip del canal especificado en el momento de la petición.

**Parámetros:**

| Parámetro  | Tipo   | Requerido | Descripción                   |
| ---------- | ------ | --------- | ----------------------------- |
| `channel`  | string | ✅        | Canal del que crear el clip   |
| `title`    | string | ❌        | Título personalizado del clip |
| `template` | string | ❌        | Plantilla para la respuesta   |
| `apiKey`   | string | ✅        | Tu API Key personal           |

**Variables en `template`:** `{url}`, `{channel}`, `{title}`

**Respuesta de ejemplo:**

```
https://clips.twitch.tv/AbcDef123456
```

---

### `POST /send-message`

Envía un mensaje al chat del canal autenticado.

**Body (JSON):**

```json
{
    "message": "Texto del mensaje (máximo 500 caracteres)"
}
```

**Parámetros URL:** `apiKey`

---

## Minijuegos

Base URL: `https://www.losperris.dev/api/twitch/minigames`

---

### `GET /magic8`

Consulta a la Bola 8 Mágica potenciada por IA. Genera respuestas únicas en cada consulta.

**Parámetros:**

| Parámetro  | Tipo   | Requerido | Descripción                           |
| ---------- | ------ | --------- | ------------------------------------- |
| `question` | string | ✅        | Pregunta a la bola (3–500 caracteres) |
| `user`     | string | ❌        | Nombre del usuario que pregunta       |
| `mood`     | string | ❌        | Personalidad de la bola (ver tabla)   |
| `apiKey`   | string | ✅        | Tu API Key personal                   |

**Modos disponibles (`mood`):**

| Valor       | Comportamiento                       |
| ----------- | ------------------------------------ |
| `classic`   | Mística y solemne (por defecto)      |
| `sarcastic` | Aburrida y cínica                    |
| `toxic`     | Posesiva y manipuladora              |
| `helpful`   | Coach de vida con positividad tóxica |

**Respuesta de ejemplo:**

```
Los astros se alinean a tu favor, @ponss17... pero tus decisiones futuras me preocupan. SÍ.
```

---

### `GET /russian`

Ruleta rusa para el chat. Determina aleatoriamente si el usuario "sobrevive" o "muere" y anuncia el resultado en el chat.

**Parámetros:**

| Parámetro  | Tipo    | Requerido | Descripción                               |
| ---------- | ------- | --------- | ----------------------------------------- |
| `channel`  | string  | ✅        | Canal donde se juega                      |
| `user`     | string  | ✅        | Usuario que juega                         |
| `hardcore` | boolean | ❌        | Si `true`, aplica timeout de 60s al morir |
| `format`   | string  | ❌        | `text` (defecto) o `json`                 |
| `apiKey`   | string  | ✅        | Tu API Key personal                       |

**Respuesta JSON (`format=json`):**

```json
{
    "status": "dead",
    "message": "@usuario aprieta el gatillo... 💥 BANG! R.I.P. 💀",
    "hardcore_applied": true
}
```

---

### `GET /duel`

Duelo narrativo entre dos usuarios del chat. Resultado aleatorio con escenario generado al azar.

**Parámetros:**

| Parámetro    | Tipo   | Requerido | Descripción                           |
| ------------ | ------ | --------- | ------------------------------------- |
| `target`     | string | ✅        | Usuario retado                        |
| `challenger` | string | ❌        | Retador (por defecto: `Keanu Reeves`) |
| `apiKey`     | string | ✅        | Tu API Key personal                   |

**Respuesta de ejemplo:**

```
⚔️ El sol está en lo alto. @ponss17 y @xqc se miran fijamente... ¡BANG! @ponss17 guarda su arma.
```

---

## Dashboard

Panel de control personal accesible en:

```
https://www.losperris.dev/api/twitch/dashboard
```

**Secciones disponibles:**

| Sección    | Contenido                                               |
| ---------- | ------------------------------------------------------- |
| Inicio     | Resumen de uso del día: peticiones, errores, latencia   |
| Actividad  | Registro cronológico de los últimos comandos ejecutados |
| Analíticas | Gráficas de uso por categoría y por día                 |
| Perfil     | Gestión de API Key, datos de cuenta y zona horaria      |

El dashboard usa sesión propia — no requiere la API Key directamente.

---

## Estado del sistema

**Endpoint público (sin autenticación):**

```
GET https://www.losperris.dev/api/twitch/health
```

```json
{
    "status": "ok",
    "timestamp": "2026-04-03T12:00:00.000Z",
    "uptime": 3600.5,
    "version": "2.9.4"
}
```

**Endpoint detallado (requiere sesión):**

```
GET /api/twitch/system/health
```

Incluye estado de base de datos, sistema de caché y conexión con Twitch, además de métricas de memoria en tiempo real.

---

## Límites y restricciones

| Recurso                                        | Límite                               |
| ---------------------------------------------- | ------------------------------------ |
| Peticiones generales                           | 1.000 / minuto por usuario           |
| Endpoints pesados (analytics, chatters, clips) | 10 / minuto por usuario              |
| Mensajes de chat                               | Máximo 500 caracteres                |
| Preguntas a la Bola 8                          | Máximo 500 caracteres                |
| Nombres de usuario/canal                       | `[a-zA-Z0-9_]`, máximo 25 caracteres |
| Títulos de clip                                | Máximo 140 caracteres                |
| Templates de respuesta                         | Máximo 500 caracteres                |

Al superar los límites se devuelve un error `429` con mensaje descriptivo.

---

## Respuestas de error

| Código | Significado                                |
| ------ | ------------------------------------------ |
| `400`  | Error de validación (parámetros inválidos) |
| `401`  | API Key inválida o ausente                 |
| `429`  | Límite de peticiones superado              |
| `500`  | Error interno del servidor                 |
| `503`  | Servicio temporalmente no disponible       |

**Formato de error de validación:**

```json
{
    "error": "Error de validación",
    "details": [
        {
            "path": "query.channel",
            "message": "Nombre de usuario Twitch inválido"
        }
    ]
}
```

---

## Integración con bots de chat

### Nightbot

Todos los endpoints responden en texto plano, compatibles directamente con `$(urlfetch)`.

**Followage:**

```
$(urlfetch https://www.losperris.dev/api/twitch/followage?channel=$(channel)&user=$(user)&apiKey=TU_KEY)
```

**Shoutout:**

```
$(urlfetch https://www.losperris.dev/api/twitch/shoutout?channel=$(channel)&touser=$(touser)&apiKey=TU_KEY)
```

**Bola 8:**

```
$(urlfetch https://www.losperris.dev/api/twitch/minigames/magic8?question=$(1+)&user=$(user)&mood=sarcastic&apiKey=TU_KEY)
```

**Ruleta Rusa:**

```
$(urlfetch https://www.losperris.dev/api/twitch/minigames/russian?channel=$(channel)&user=$(user)&hardcore=false&apiKey=TU_KEY)
```

**Duelo:**

```
$(urlfetch https://www.losperris.dev/api/twitch/minigames/duel?target=$(1)&challenger=$(user)&apiKey=TU_KEY)
```

### StreamElements / Moobot

Misma URL base. Sustituir las variables de Nightbot por las equivalentes del bot correspondiente.

---

## Stack técnico

| Componente    | Tecnología            |
| ------------- | --------------------- |
| Runtime       | Node.js + TypeScript  |
| Framework     | Express.js            |
| Base de datos | Supabase (PostgreSQL) |
| Caché         | Redis (Vercel KV)     |
| Despliegue    | Vercel (serverless)   |
| API externa   | Twitch Helix API v2   |
| IA (Bola 8)   | Groq — LLaMA 3.3 70B  |

---

_© 2026 LosPerrisAPI — Documentación de uso privado._
