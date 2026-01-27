# LosPerrisAPI (Twitch Dashboard & API) 🚀

> 💎 **Arquitectura Premium**: Dashboard y API profesional para streamers, construida con un enfoque modular, seguro y altamente escalable.

---

## 🔥 Características Destacadas

### 🛠️ API REST de Alto Rendimiento
- **Comandos Dinámicos**: Followage con precisión de segundos, creación de Clips automatizada y Shoutouts inteligentes.
- **Bola 8 con IA**: Generación de respuestas con personalidad seleccionable (Clásica, Sarcástica, Tóxica, Amable) mediante modelos de lenguaje avanzados.
- **Caché Inteligente**: Implementación de Redis (Vercel KV) para minimizar latencias y llamadas redundantes a la API de Twitch.

### 🖥️ Dashboard Pro (Next-Gen UI)
- **Diseño Glassmorphism**: Interfaz oscura ultra-moderna con efectos de desenfoque y animaciones fluidas.
- **Arquitectura de Ciclo de Vida**: Motor de dashboard que gestiona la carga y limpieza de módulos (`init` / `deactivate`) dinámicamente.
- **Lazy Loading Extremo**: Carga bajo demanda de HTML, CSS y JS TypeScript, optimizando el tiempo de respuesta inicial.
- **XSS-Shield**: Sistema de renderizado seguro que protege contra inyecciones maliciosas en perfiles, clips y mensajes del chat.

### 🛰️ Herramientas en Tiempo Real
- **Stalker**: Monitor avanzado de chat con inspección de perfiles en tiempo real.
- **Tendencias**: Análisis léxico del chat en vivo con sistema de ranking y temporizador.
- **Ruleta Interactiva**: Sorteos interactivos con física de giro y temática Twitch personalizada.
- **Arquitectura Modular**: CSS unificado en `common.css` para componentes compartidos y carga bajo demanda para estilos específicos.

---

## 🏗️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Backend** | Node.js, Express, TypeScript |
| **Persistencia** | Vercel KV (Redis) para caché y estadísticas |
| **Frontend** | Vanilla JS (Modular/ES6), CSS3 Custom Properties, FontAwesome |
| **Seguridad** | OAuth2 (Twitch), Encriptación AES-256, Helmet CSP, Rate Limiting |
| **IA** | Groq SDK (LLM integration) |

---

## 📂 Estructura del Proyecto

```text
/
├── frontend/        # Código fuente TypeScript del Dashboard
├── src/             # Backend: Lógica de negocio y API
├── public/          # Build: Assets estáticos y JS compilado
├── api/             # Entry point para despliegue
```

---

## 🔒 Seguridad y Privacidad

- **Zero-Value Logs**: No almacenamos información privada de los usuarios sin su consentimiento.
- **Secure Sessions**: Tokens de Twitch guardados con cifrado de grado militar y rotación automática.
- **Centralized Messages**: Toda la comunicación con el usuario gestionada desde `messages.js` para consistencia absoluta.

---
© 2026 LosPerrisAPI. Desarrollado con excelencia técnica para la comunidad de Twitch. 💜🦾
