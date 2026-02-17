import express, { Application } from 'express';
import fs from 'fs';
import path from 'path';
import { configureMiddleware } from './startup/middleware';
import { configureStatic } from './startup/static';
import { configureRoutes, configurePageRoutes } from './startup/routes';

const app: Application = express();

// 1. Middleware Global (Logs, Security, Body Parser)
configureMiddleware(app);

// 2. Rutas de Páginas (HTML, Admin, Docs) - PRIORITARIAS antes de estáticos
// Esto evita que carpetas como /public/admin causen redirects (301) indeseados
configurePageRoutes(app);

// DEBUG EXTREMO: Ruta definida directamente en app.ts para evitar problemas de router
app.get('/api/twitch/debug-paths', (req, res) => {
    const pathsToCheck = [
        path.join(process.cwd(), 'public'),
        path.join(process.cwd(), 'dist/public'),
        path.join(__dirname, '../public'),
        path.join(__dirname, '../../public')
    ];
    const results = pathsToCheck.map((p: string) => ({
        path: p,
        exists: fs.existsSync(p),
        contents: fs.existsSync(p) ? fs.readdirSync(p).slice(0, 5) : 'N/A'
    }));
    res.json({ cwd: process.cwd(), dirname: __dirname, results });
});

// 3. Archivos Estáticos (Assets, CSS, JS)
configureStatic(app);

// 4. Rutas y Lógica de Negocio (API)
configureRoutes(app);

export default app;
