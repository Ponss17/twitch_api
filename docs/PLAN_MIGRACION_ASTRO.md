# Plan de Migración Arquitectónica: Vanilla TS a Astro

**Contexto y Justificación (Por qué Astro es la mejor opción):**
Basado en el `ARCHITECTURE.md` actual, el proyecto valora el rendimiento extremo, los tiempos de carga instantáneos (cold starts mínimos) y un tamaño de bundle microscópico (~50KB).
Migrar a React/Next.js destruiría estas ventajas al inyectar más de 150KB de runtime JS. **Astro es, sin lugar a dudas, la mejor decisión técnica.** Astro compila a HTML estático por defecto (Zero JS) y permite inyectar JavaScript únicamente donde es necesario mediante su "Arquitectura de Islas", replicando exactamente el sistema de _lazy loading_ actual pero de forma estandarizada, más segura y fácil de mantener.

**REGLAS ESTRICTAS A SEGUIR POR LA IA EJECUTORA:**

1. Todos los comentarios, planes y explicaciones deben estar en **español**.
2. **NUNCA** dejar comentarios en archivos públicos del frontend (`.astro`, `.html`, `.ts` de cliente), excepto aquellos estrictamente necesarios para evitar errores (ej. `@ts-ignore`).
3. Usar **pnpm** para la gestión de paquetes en todos los comandos.
4. Evitar palabras o etiquetas de marketing como "premium", "pro", etc.
5. El backend (Express) NO debe perder su rol como puerta de entrada en Vercel.

---

## Estructura Esperada del Proyecto Frontend

La carpeta `frontend/` pasará de ser un conjunto de scripts Vanilla para `esbuild` a un proyecto completo de Astro:

```
twitch_api/
├── api/             (Sin cambios)
├── src/             (Sin cambios - Backend)
└── frontend_astro/  (Nuevo Frontend)
    ├── public/      (Assets estáticos, imágenes)
    ├── src/
    │   ├── components/  (UI compartida: Navbar, Sidebar, Modales. .astro)
    │   ├── layouts/     (Layout base con el <head> y estilos globales)
    │   ├── pages/       (dashboard.astro, index.astro)
    │   ├── islands/     (Componentes TS interactivos cargados con client:load)
    │   ├── store/       (Migración de store.ts y dashboardStore.ts)
    │   └── styles/      (index.css global)
    ├── astro.config.mjs
    └── tsconfig.json
```

---

## Fase 1: Inicialización Estricta (Comandos)

1. Abrir terminal en la raíz (`twitch_api/`).
2. Ejecutar: `pnpm create astro@latest frontend_astro --template minimal --install=false --typescript strict`
3. Entrar a la carpeta: `cd frontend_astro`
4. Ejecutar: `pnpm install`
5. Configurar `astro.config.mjs` para que el resultado de compilación (`outDir`) vaya a una carpeta que Express pueda servir, por ejemplo:
    ```javascript
    import { defineConfig } from 'astro/config';
    export default defineConfig({
        outDir: '../public/astro', // Express servirá estáticos desde aquí
        build: { format: 'file' }
    });
    ```

---

## Fase 2: Migración del Core y Layouts (El Esqueleto)

1. **El archivo `src/layouts/Layout.astro`:**
   Este archivo reemplazará al antiguo `index.html`. Debe contener la estructura básica.
   _Importante:_ Express actualmente inyecta el `nonce` para CSP. Debemos asegurarnos de que el Layout de Astro permita inyectar meta tags dinámicos, o bien que Express sirva el HTML de Astro y reemplace placeholders (ej. `__NONCE__`) en tiempo de ejecución.
2. **Estilos Globales:**
   Mover `frontend/core/index.css` a `frontend_astro/src/styles/global.css`.
   Importarlo directamente en el frontmatter de `Layout.astro`:

    ```astro
    ---
    import '../styles/global.css';
    ---
    ```

3. **Migración del Store Global:**
   Mover `frontend/core/store.ts` a `frontend_astro/src/store/store.ts`. Al ser Vanilla TS, funcionará sin problemas dentro de Astro.

---

## Fase 3: Arquitectura de Islas (Refactorizando el Lazy Loading)

El sistema actual usa `HtmlLoader` para inyectar HTML y ejecutar JS bajo demanda. Astro hace esto de forma nativa.

1. **Crear la vista principal (`src/pages/dashboard.astro`):**
   Esta página importará los diferentes módulos (pestañas), pero no los ejecutará de golpe.

2. **Migración de un Módulo (Ejemplo: Pestaña 'Clips'):**
    - En lugar de tener un `clips.ts` que manipula el DOM directamente, crearemos un componente `.astro` para el esqueleto HTML de esa pestaña.
    - Si la pestaña "Clips" necesita interactividad (buscar clips, reproducirlos), ese código JS irá en un componente de "Isla" interactivo.
    - **Implementación en `dashboard.astro`:**
        ```astro
        ---
        import Layout from '../layouts/Layout.astro';
        import TabClips from '../components/TabClips.astro';
        import TabAccount from '../components/TabAccount.astro';
        ---
        <Layout>
          <div id="dashboard-container">
            <!-- client:visible asegura que el JS de la pestaña solo se descargue/ejecute cuando el usuario cambie a ella -->
            <TabAccount client:visible />
            <TabClips client:visible />
          </div>
        </Layout>
        ```

3. **Interacciones puras en TS (Web Components):**
   Como Astro por defecto es solo HTML, si no quieres usar React/Svelte para las islas, puedes definir la interactividad usando Web Components (Custom Elements) nativos en TypeScript, importándolos en los archivos `.astro` usando `<script>`.

---

## Fase 4: Sincronización Express - Vercel - Astro

1. **Eliminar `esbuild`:**
   En el `package.json` principal (el de Express), eliminar los scripts de `esbuild`.
   El nuevo script de construcción (`build`) debe ser:
   `"build": "cd frontend_astro && pnpm build && cd .. && tsc"`
   Esto asegurará que Astro compile el frontend y luego TypeScript compile el backend.

2. **Express sirviendo Astro:**
   Modificar el `app.ts` de Express para que sirva correctamente la carpeta resultante del build de Astro.

    ```typescript
    // En lugar de servir public/js estático, ahora sirve el output de Astro
    app.use(express.static(path.join(__dirname, '../public/astro')));
    ```

3. **Configuración de Vercel (`vercel.json`):**
   Asegurarse de que el tráfico entrante de Vercel redirija todas las peticiones HTML al servidor de Express para que siga manejando middlewares (auth, csp). Express internamente enviará los HTML generados por Astro.

---

## Fase 5: Pruebas de Calidad (QA)

1. **Verificación de Red (Network Tab):** Al entrar al Dashboard, confirmar que **solo** se descarga el JS de la pestaña inicial activa. Al hacer clic en otra pestaña (ej. Ruleta), confirmar que se hace un request de red para descargar ese JS específico.
2. **Tamaño del Bundle:** Revisar la carpeta de salida (`public/astro/dist`). El JS total no debería superar por mucho los 50-60KB.
3. **Autenticación y CSP:** Confirmar que el login de Twitch funciona y que el Content Security Policy de Express no bloquea los scripts empaquetados por Astro.

---

**Nota para la IA:** No des por hecho que la migración será trivial. El mayor reto será adaptar la inyección dinámica de CSP Nonces que hace Express en el HTML estático que genera Astro. Usa técnicas de reemplazo de texto (`.replace('__CSP_NONCE__', res.locals.nonce)`) en el backend si es necesario.
