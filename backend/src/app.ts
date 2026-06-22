import express, { Application } from 'express';
import { configureMiddleware } from './core/startup/middleware';
import { configureRoutes } from './core/startup/routes';
import { validateConfig } from './core/startup/config-check';

validateConfig();

const app: Application = express();

app.set('etag', 'strong');

// Middleware global (logs, security, body parser)
configureMiddleware(app);

// Solo rutas API — el frontend lo sirve Astro
configureRoutes(app);

export default app;
