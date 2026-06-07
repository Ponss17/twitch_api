import express, { Application } from 'express';
import { configureMiddleware } from './core/startup/middleware';
import { configureStatic } from './core/startup/static';
import { configureRoutes, configurePageRoutes } from './core/startup/routes';
import { validateConfig } from './core/startup/config-check';

validateConfig();

const app: Application = express();

app.set('etag', 'strong');

// 1. Middleware Global (Logs, Security, Body Parser)
configureMiddleware(app);

// 2. Rutas de Páginas (HTML, Docs) - PRIORITARIAS antes de estáticos
// Esto evita que carpetas como /public/ causen redirects (301) indeseados
configurePageRoutes(app);

// 3. Archivos Estáticos (Assets, CSS, JS)
configureStatic(app);

// 4. Rutas y Lógica de Negocio (API)
configureRoutes(app);

export default app;
