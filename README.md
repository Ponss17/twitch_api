# LosPerrisAPI (Twitch Dashboard & API) 🚀

> Suite de herramientas para streamers de Twitch desarrollada con arquitectura modular, enfoque en seguridad de datos y optimización de rendimiento en el lado del cliente.

---

## 🛠️ Especificaciones Técnicas

Estructura diseñada bajo parámetros de integridad y eficiencia:

- **⚙️ Capas de Seguridad**: Implementación de políticas de CORS restrictivas mediante whitelist de dominios, sanitización proactiva de entradas HTML para prevenir inyecciones (XSS) y cifrado AES-256-CBC para la persistencia de tokens de sesión en base de datos.
- **⚡ Optimización de Recursos**: Uso de Vanilla TypeScript para evitar carga de frameworks externos, sistema de carga bajo demanda (lazy loading) de componentes y orquestación visual mediante `requestAnimationFrame`.
- **🧪 Cobertura de Pruebas**: Suite de **37 tests unitarios** que validan la lógica de controladores, servicios de autenticación y flujos de infraestructura.

---

## 🔍 Detalle de Funcionalidades

### Panel de Administración y Dashboard

- **Arquitectura de Micro-módulos**: Sistema que gestiona de forma independiente la inicialización y limpieza (`init` / `deactivate`) de cada sección para optimizar el uso de memoria.
- **Interfaz Glassmorphism**: Diseño basado en variables CSS dinámicas, efectos de desenfoque de fondo (`backdrop-filter`) y transiciones fluidas.
- **XSS-Shield**: Procesamiento de datos de usuario mediante la función `sanitizeHtml` antes de su visualización en los paneles de actividad.

### Herramientas de Interacción e IA

- **Integración Groq LLM**: Sistema de IA para comandos de chat con 4 perfiles de respuesta configurables:
    - **Clásica**: Respuestas estándar con tono místico.
    - **Sarcástica**: Interacciones basadas en ironía.
    - **Tóxica**: Respuestas con tono provocativo y directo.
    - **Amable**: Soporte y respuestas motivadoras.
- **Stalker de Perfiles**: Consulta en tiempo real de metadatos de usuario (ID, avatar, actividad y estadísticas públicas).
- **Word Cloud & Tendencias**: Algoritmo de análisis léxico que identifica términos recurrentes en el chat y genera rankings de frecuencia.
- **Simulaciones Visuales CSS**:
    - **Ruleta Rusa**: Lógica de probabilidad con respuesta visual inmediata.
    - **Ruleta de Selección**: Animación con simulación de fricción y deceleración mediante transformaciones CSS.

### Capa de API y Conectividad

- **Comandos de Utilidad**:
    - `!followage`: Desglose exacto de tiempo de seguimiento (años, meses, días).
    - `!clip`: Interfaz con la API de Twitch para generación inmediata de clips.
    - `!shoutout`: Generación automática de recomendaciones con metadatos del canal (link y categoría actual).
- **Generador de Documentación**: Adaptación dinámica de la sintaxis de comandos para bots externos como **Nightbot**, **Fossabot** y **StreamElements**.
- **Sistema de Caché**: Persistencia en tres niveles: Memoria local (Hot), Vercel KV (Shared Redis) y CDN.

---

## 🏗️ Stack Tecnológico

| Componente        | Tecnología                             | Implementación                                     |
| :---------------- | :------------------------------------- | :------------------------------------------------- |
| **Backend**       | Node.js, Express, TypeScript           | Lógica de servidor y API REST                      |
| **Frontend**      | Vanilla TS, CSS3, Esbuild              | Interfaz de usuario sin dependencias de frameworks |
| **Base de Datos** | Vercel KV (Redis)                      | Gestión de sesiones, logs y estadísticas rápidas   |
| **Testing**       | Jest, TS-Jest                          | Validación automática de 37 escenarios críticos    |
| **Seguridad**     | AES-256, Helmet, OAuth2, Rate Limiting | Encriptado de datos y protección de headers        |

---

## 📊 Métricas de Código (SLOC Total)

Total de **14,478+ líneas** de código fuente desarrollado:

| Directorio                       | Líneas      | Función                                |
| :------------------------------- | :---------- | :------------------------------------- |
| **Backend (`src/`)**             | 2,709       | Controladores, servicios y middlewares |
| **Frontend (`frontend/`)**       | 5,164       | Lógica de la UI y gestión del DOM      |
| **Diseño (`public/css/`)**       | 4,797       | Estilos modulares y animaciones        |
| **Estructura (`public/*.html`)** | 1,196       | Plantillas y componentes visuales      |
| **Pruebas (`tests/`)**           | 612         | Suite de validación unitaria           |
| **TOTAL FUENTE**                 | **14,478+** | **Volumen de ingeniería**              |

---

## 📂 Organización de Archivos

```text
twitch_api/
├── 📂 tests/                # 🧪 Suite de 37 Tests (Jest)
│   ├── controllers/         # Pruebas de Dashboard y Comandos
│   ├── services/            # Pruebas de servicios y autenticación
│   └── infrastructure/      # Pruebas de salud y persistencia (KV)
│
├── 📂 src/                  # 🛡️ Backend
│   ├── startup/             # Inicialización (CORS, Rutas, Estáticos)
│   ├── controllers/         # Controladores con sanitización XSS integrada
│   └── services/            # Lógica (Auth, Twitch API, AES Encryption)
│
├── 📂 frontend/             # 🎨 Lógica Frontend (Vanilla TS)
│   ├── features/            # Módulos: Docs, Dashboard, Admin, Games
│   └── core/                # Orquestador de rutas y sesiones
│
└── 📂 public/               # 📦 Assets finales
    ├── js/                  # Compilados de TypeScript
    └── css/                 # Hojas de estilo modulares
```

---

© 2026 LosPerrisAPI. Desarrollado con enfoque en robustez y eficiencia para la comunidad de Twitch. 💜🦾
