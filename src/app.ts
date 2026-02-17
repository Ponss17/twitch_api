import express, { Application } from 'express';
import { configureMiddleware } from './startup/middleware';
import { configureStatic } from './startup/static';
import { configureRoutes, configurePageRoutes } from './startup/routes';

const app: Application = express();

// 1. Middleware Global (Logs, Security, Body Parser)
configureMiddleware(app);

// 2. Rutas de Páginas (HTML, Admin, Docs) - PRIORITARIAS antes de estáticos
// Esto evita que carpetas como /public/admin causen redirects (301) indeseados
configurePageRoutes(app);

// 3. Archivos Estáticos (Assets, CSS, JS)
configureStatic(app);

// 4. Rutas y Lógica de Negocio (API)
configureRoutes(app);

export default app;
