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
- **Mobile-First Responsive**: Diseño totalmente adaptativo que escala perfectamente desde escritorio hasta dispositivos móviles.
- **Arquitectura de Ciclo de Vida**: Motor de dashboard que gestiona la carga y limpieza de módulos (`init` / `deactivate`) dinámicamente.
- **Lazy Loading Extremo**: Carga bajo demanda de HTML, CSS y JS TypeScript, optimizando el tiempo de respuesta inicial.
- **XSS-Shield**: Sistema de renderizado seguro que protege contra inyecciones maliciosas en perfiles, clips y mensajes del chat.

### 🛰️ Herramientas en Tiempo Real

- **Stalker**: Monitor avanzado de chat con inspección de perfiles en tiempo real.
- **Tendencias**: Análisis léxico del chat en vivo con sistema de ranking y temporizador.
- **Ruleta Interactiva**: Sorteos interactivos con física de giro y temática Twitch personalizada.
- **Ruleta Rusa (Bang)**: Minijuego de riesgo con interfaz inmersiva y animaciones CSS personalizadas.
- **Arquitectura Modular**: CSS unificado en `common.css` para componentes compartidos y carga bajo demanda para estilos específicos.

---

## 🏗️ Stack Tecnológico

| Capa             | Tecnologías                                     |
| :--------------- | :---------------------------------------------- |
| **Backend**      | Node.js, Express, TypeScript                    |
| **Frontend**     | TypeScript (Modular), Vanilla CSS3, FontAwesome |
| **Persistencia** | Vercel KV (Redis) para caché y estadísticas     |
| **Testing**      | Jest, Supertest, TS-Jest                        |
| **Calidad**      | ESLint, Prettier, Husky                         |
| **Seguridad**    | OAuth2, AES-256, Helmet CSP, Rate Limiting      |
| **IA**           | Groq SDK (LLM integration)                      |

---

## 📂 Estructura del Proyecto

```text
/
├── frontend/        # Código fuente TypeScript del Dashboard
├── src/             # Backend: Lógica de negocio y API
├── tests/           # Unit & Integration Tests (Jest)
├── public/          # Build: Assets estáticos y JS compilado
├── api/             # Entry point para despliegue
```

---

## 🔒 Seguridad y Privacidad

- **Zero-Value Logs**: No almacenamos información privada de los usuarios sin su consentimiento.
- **Secure Sessions**: Tokens de Twitch guardados con cifrado de grado militar y rotación automática.
- **Centralized Messages**: Toda la comunicación con el usuario gestionada desde `messages.js` para consistencia absoluta.

---

| Categoría                       | Líneas de Código |
| :------------------------------ | :--------------- |
| **Backend (src)**               | 2,372            |
| **Frontend (logic)**            | 4,714            |
| **Diseño (CSS)**                | 3,941            |
| **Tests (Jest)**                | 172              |
| **Estructura (HTML)**           | 2,046            |
| **Puntaje Total Fuente (SLOC)** | **13,245**       |

> [!NOTE]
> El proyecto tiene una huella total de **~22,400 líneas** incluyendo compilados y dependencias, pero el núcleo original desarrollado es de aproximadamente **10k líneas**.

---

© 2026 LosPerrisAPI. Desarrollado con excelencia técnica para la comunidad de Twitch.💜🦾
