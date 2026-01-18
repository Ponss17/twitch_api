# LosPerrisAPI (Twitch Dashboard & API)

> 🔒 **Repositorio Privado**: Este código es propiedad confidencial. No distribuir sin autorización.

API y Dashboard profesional para integración con Twitch, construido con Node.js, Express y TypeScript.

![Dashboard Preview](https://via.placeholder.com/800x400?text=LosPerrisAPI+Dashboard+Preview)

## 🚀 Características

### 🛠️ API REST
- **Comandos**: Clips, Followage, Shoutouts, Mensajes.
- **Autenticación**: OAuth2 de Twitch con encriptación de tokens (AES-256).
- **Seguridad**: Rate Limiting, Helmet (CSP), Validación de parámetros.
- **IA**: Generación de respuestas inteligentes (si está configurado).

### 🖥️ Dashboard Interactivo
- **Diseño Premium**: Interfaz moderna, oscura y responsiva ("Glassmorphism").
- **Módulos**:
    - 🛰️ **Stalker**: Visor de chat en tiempo real con detección de usuarios.
    - 📈 **Estadísticas**: Rastreo de uso de comandos (Redis).
    - 📊 **Tendencias**: Tracker de palabras más usadas en el chat con temporizador.
- **Micro-interacciones**: Animaciones, Toasts notificadores, transiciones suaves.

## 🏗️ Tecnología

- **Backend**: Node.js, Express, TypeScript.
- **Base de Datos**: Vercel KV (Redis) para caché y persistencia de usuarios/stats.
- **Frontend**: Vanilla JS (Modular, ES6+), CSS3 Variables, FontAwesome.
- **Seguridad**: Cifrado AES-256 para tokens sensibles.

## 📂 Estructura del Proyecto

```
/
├── api/            # Punto de entrada (Vercel/Node)
├── public/         # Frontend Estático (HTML, CSS, JS)
│   ├── css/        # Estilos modulares
│   ├── js/         # Módulos JS (Dashboard, Auth, Utils)
│   └── dashboard   # Lógica específica de módulos
├── src/            # Código Fuente Backend
│   ├── config/     # Configuración y Constantes
│   ├── controllers/# Controladores de rutas
│   ├── services/   # Lógica de negocio (Twitch, DB, AI)
│   ├── routes/     # Definiciones de rutas Express
│   └── types/      # Interfaces TypeScript
└── ...
```

## 🔒 Seguridad

El proyecto utiliza las mejores prácticas de seguridad:
- Las API Keys de usuario se almacenan encriptadas.
- Todas las rutas sensibles están protegidas por middleware de autenticación.
- Uso estricto de HTTPS (en producción).

---
© 2026 LosPerrisAPI. Creado con ❤️ para la comunidad.
