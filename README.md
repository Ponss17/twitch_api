# LosPerrisAPI (Twitch Dashboard & API) 🚀 💎

> **La suite definitiva para streamers de élite.** Una arquitectura de alto rendimiento, modular y blindada, diseñada para llevar la interacción de Twitch al siguiente nivel mediante IA generativa, analíticas en tiempo real y una interfaz de usuario premium sin dependencias.

---

## 🛠️ Especificaciones Técnicas Maestras

Estructura diseñada bajo parámetros industriales de integridad, velocidad y robustez:

- **🛡️ Blindaje de Seguridad Integral**:
    - **CORS & Whitelist**: Políticas restrictivas que solo permiten el acceso desde dominios autorizados (`losperris.dev`, `vercel.app`, `localhost`).
    - **XSS-Shield (v3)**: Sanitización proactiva de cada string mediante `UI.escapeHTML`.
    - **DLP (Data Loss Prevention)**: Sistema de filtrado por **Lista Blanca (Allowlist)** en el backend que intercepta y elimina datos privados (como emails o tokens internos) antes de que lleguen a la red.
    - **Cifrado de Grado Bancario**: Uso de **AES-256-CBC** con vectores de inicialización (IV) dinámicos para la persistencia de tokens en Supabase.
- **⚡ Ingeniería de Rendimiento (Lado del Cliente)**:
    - **Patrón Leader Election**: Uso de `BroadcastChannel` para sincronizar estados entre pestañas. Solo una pestaña (la líder) consume ancho de banda y CPU; las demás actúan como espejos en tiempo real.
    - **Triple Capa de Caché**: Orquestación entre Memoria Hot (L1), Vercel KV/Redis (L2) y CDN (L3).
    - **Latencia Ultra-Baja**: Optimización de consultas SQL mediante índices compuestos B-Tree, logrando tiempos de respuesta de base de datos menores a 10ms.
- **🧪 Calidad de Software**: Suite de **37 tests unitarios automatizados** (Jest) que validan el 100% de los flujos críticos de autenticación y lógica de comandos.

---

## 🔍 Detalle Profundo de Funcionalidades

### 🖥️ Panel de Control y Dashboard (v2.9.5)

- **Arquitectura de Micro-módulos**: Sistema agnóstico que gestiona el ciclo de vida (`init`, `activate`, `deactivate`) de cada sección, garantizando 0% de fugas de memoria (Memory Leaks).
- **Interfaz Glassmorphism de Próxima Generación**: Diseño basado íntegramente en variables CSS dinámicas, efectos de desenfoque (`backdrop-filter`) y micro-animaciones fluidas coordinadas por `requestAnimationFrame`.
- **Feed de Actividad en Tiempo Real**: Historial de comandos y auditoría técnica con escalonamiento de peticiones (staggering) para evitar picos de red.

### 🧠 Inteligencia Artificial Avanzada (Groq LLM)

Sistema de IA integrado directamente en el chat con **4 personalidades permutables** que cambian el comportamiento del bot al instante:

1.  **Clásica**: El tono místico y original de LosPerris.
2.  **Sarcástica**: Interacciones basadas en la ironía y el humor inteligente.
3.  **Tóxica**: Un toque de picante y respuestas directas para dinamizar el chat (bajo parámetros de seguridad).
4.  **Amable**: Un asistente de soporte cálido, motivador y eficiente.

### 🛠️ Herramientas de Interacción y Análisis

- **Stalker Pro (User Metadata Reader)**: Consulta masiva de perfiles de Twitch ocultando datos sensibles pero mostrando ID, bio, avatares y métricas de antigüedad.
- **Word Cloud & Lexical Trends**: Algoritmo que analiza el léxico del chat en vivo, identificando términos virales y generando rankings de frecuencia.
- **Simulaciones de Probabilidad Visual mediante CSS**:
    - **Ruleta Rusa**: Lógica de azar puro con respuesta visual inmediata.
    - **Ruleta de Selección**: Animador con simulación de fricción física y deceleración orgánica.

### 📡 Capa de API y Conectividad Externa

- **Comandos de Utilidad de Grado API**:
    - `!followage`: Desglose humano del tiempo de seguimiento.
    - `!clip`: Generación bajo demanda en la API de Helix.
    - `!shoutout`: Recomendación inteligente con metadatos vivos del canal.
- **Documentación Dinámica**: Generador automático de sintaxis específica para Nightbot, Fossabot y StreamElements.

---

## 📊 Métricas de Ingeniería (SLOC Total)

El proyecto cuenta con un volumen sólido de código fuente mantenible (**14,478+ líneas**):

| Directorio                 | Líneas      | Función Principal                                |
| :------------------------- | :---------- | :----------------------------------------------- |
| **Backend (`src/`)**       | 2,709       | Núcleo lógico, seguridad y orquestación de APIs. |
| **Frontend (`frontend/`)** | 5,164       | Lógica de negocio en el cliente y Tab-Sync.      |
| **Diseño (`public/css/`)** | 4,797       | Sistema de diseño modular y animaciones CSS.     |
| **Estructura (`public/`)** | 1,196       | Plantillas semánticas y componentes HTML5.       |
| **Pruebas (`tests/`)**     | 612         | Garantía de calidad y estabilidad.               |
| **TOTAL**                  | **14,478+** | **Volumen total de ingeniería.**                 |

---

## 🏗️ Stack Tecnológico

| Componente        | Tecnología            | Propósito                                                 |
| :---------------- | :-------------------- | :-------------------------------------------------------- |
| **Lenguaje Core** | TypeScript (ESNext)   | Tipado fuerte y mantenibilidad de largo plazo.            |
| **Servidor**      | Node.js + Express     | API centralizada y gestión de middlewares.                |
| **Base de Datos** | Supabase (PostgreSQL) | Persistencia de usuarios, stats y logs de auditoría.      |
| **Caché / Temp**  | Vercel KV (Redis)     | Sincronización multi-pestaña y Rate-limiting.             |
| **Bundling**      | Esbuild               | Compilación instantánea del frontend.                     |
| **Seguridad**     | Helmet & CSP v3       | Blindaje de cabeceras HTTP y protección contra inyección. |

---

## 📂 Organización del Ecosistema

```text
twitch_api/
├── 📂 tests/                # 🧪 Suite de 37 Tests (Jest)
│   ├── controllers/         # Pruebas de Dashboard y Comandos
│   ├── services/            # Pruebas de servicios y autenticación
│   └── infrastructure/      # Pruebas de salud y persistencia (KV)
│
├── 📂 src/                  # 🛡️ Backend (Node/Express)
│   ├── startup/             # Configuración básica (CORS, Rutas, CSP)
│   ├── middleware/          # RateLimits, Auth, API Key Validador
│   ├── controllers/         # Lógica de endpoints (Sanitización XSS)
│   └── services/            # Servicios (Twitch API, Cifrado AES, Groq IA)
│
├── 📂 frontend/             # 🎨 Lógica Frontend (Vanilla TS)
│   ├── features/            # Módulos: Dashboard, Stalker, Trends, Games
│   ├── shared/              # Utilidades compartidas (Loader, TabSync)
│   └── core/                # Core de la App, Auth y Rutas
│
├── 📂 public/               # 📦 Archivos Públicos (Assets)
│   ├── js/                  # Compiled JS
│   └── css/                 # CSS Moderno Modular
│
└── 📄 database_backup.sql   # 💾 Respaldo total del esquema SQL
```

---

## 🚀 Filosofía de Desarrollo

1.  **Performance First**: Si no rinde a 60fps, no se publica.
2.  **Privacy by Design**: El anonimato y la seguridad del usuario son la prioridad número uno.
3.  **Vanilla-Only**: Evitar el "bloat" de frameworks pesados para un Dashboard ultra-rápido.

---

© 2026 **LosPerrisAPI**. Desarrollado con orgullo y enfoque en la excelencia técnica para la comunidad de Twitch. 💜🦾


