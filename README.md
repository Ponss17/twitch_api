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
- **Herramientas en Tiempo Real**:
    - 🛰️ **Stalker**: Monitor avanzado de chat con inspección de perfiles y logs de sesión.
    - 📊 **Tendencias**: Análisis léxico del chat en vivo con sistema de ranking y temporizador.
    - 🎡 **Ruleta Interactiva**: Sistema de sorteos híbrido (API + Chat) con física de giro y anuncios automáticos.
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
├── src/
│   ├── config/      # Configuración de entorno y mensajes centralizados
│   ├── controllers/ # Controladores de API y Dashboard
│   ├── services/    # Lógica de negocio (Twitch, AI, Redis)
│   ├── middleware/  # Protección de rutas y validaciones
│   └── routes/      # Endpoints organizados
├── public/
│   ├── css/         # Estilos: dashboard.css (layout) + common.css (piezas)
│   ├── js/          # Lógica modular del Dashboard
│   └── components/  # Fragmentos HTML cargados dinámicamente
└── api/             # Punto de entrada para despliegue
```

---

## 🔒 Seguridad y Privacidad

- **Zero-Value Logs**: No almacenamos información privada de los usuarios sin su consentimiento.
- **Secure Sessions**: Tokens de Twitch guardados con cifrado de grado militar y rotación automática.
- **Centralized Messages**: Toda la comunicación con el usuario gestionada desde `messages.js` para consistencia absoluta.

---
© 2026 LosPerrisAPI. Desarrollado con excelencia técnica para la comunidad de Twitch. 💜🦾
