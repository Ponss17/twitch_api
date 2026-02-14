import express, { Application } from 'express';
import { configureMiddleware } from './startup/middleware';
import { configureStatic } from './startup/static';
import { configureRoutes } from './startup/routes';

const app: Application = express();

// 1. Middleware Global (Logs, Security, Body Parser)
configureMiddleware(app);

// 2. Archivos Estáticos (Assets, CSS, JS) - Antes de rutas dinámicas
configureStatic(app);

// 3. Rutas y Lógica de Negocio
configureRoutes(app);

export default app;
