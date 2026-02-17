import { Application, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config/env';
import rateLimiter, { authLimiter } from '../middleware/rateLimiter';
import { apiKeyValidator } from '../middleware/apiKeyValidator';
import authRoutes from '../routes/authRoutes';
import adminRouter from '../routes/admin';
import apiRouter from '../routes/index';
import { getRobotsTxt, getSitemapXml } from '../controllers/system/seoController';
import { errorHandler } from '../middleware/errorMiddleware';

export const configurePageRoutes = (app: Application) => {
    // --- VISTAS Y RUTAS ESTATICAS (HTML) ---
    // Estas rutas se configuran ANTES de los estáticos para evitar conflictos de carpetas (redirects 301)

    app.get(['/docs', '/api/twitch/docs'], (req: Request, res: Response) => {
        res.sendFile(path.join(__dirname, '../../public/docs.html'));
    });

    app.get(['/dashboard', '/api/twitch/dashboard'], (req: Request, res: Response) => {
        res.sendFile(path.join(__dirname, '../../public/dashboard.html'));
    });

    app.get(['/admin', '/api/twitch/admin'], (req: Request, res: Response) => {
        res.sendFile(path.join(__dirname, '../../public/admin/login.html'));
    });

    app.get(['/admin-dashboard', '/api/twitch/admin-dashboard'], (req: Request, res: Response) => {
        res.sendFile(path.join(__dirname, '../../public/admin/dashboard.html'));
    });

    // SEO (Servidos como páginas/archivos)
    app.get(['/robots.txt', '/api/twitch/robots.txt'], getRobotsTxt);
    app.get(['/sitemap.xml', '/api/twitch/sitemap.xml'], getSitemapXml);
};

export const configureRoutes = (app: Application) => {
    // --- VALIDACIÓN Y RATE LIMIT (PARA RUTAS DINÁMICAS/API) ---
    app.use(apiKeyValidator);
    app.use(rateLimiter);

    // Rutas de Admin (API)
    app.use(['/api/admin', '/api/twitch/admin', '/admin/api', '/admin'], adminRouter);

    // Rutas API/Twitch
    // Usamos montajes individuales para mayor claridad en Express
    app.use('/auth', authLimiter, authRoutes);
    app.use('/api/twitch/auth', authLimiter, authRoutes);
    app.use('/twitch/auth', authLimiter, authRoutes);

    // Router API Principal (Agrega juegos, comandos, dashboard, sistema)
    app.use('/api/twitch', apiRouter);
    app.use('/twitch', apiRouter);
    app.use('/', apiRouter);

    // Verificación de Estado (Health Check)
    app.get(['/health', '/api/twitch/health'], (req: Request, res: Response) => {
        const isConfigured = !!(CONFIG.TWITCH_CLIENT_ID && CONFIG.TWITCH_CLIENT_SECRET);
        res.json({
            status: isConfigured ? 'ok' : 'maintenance',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '2.9.4'
        });
    });

    // DEBUG: Path verification (temporary)
    app.get('/api/twitch/debug-paths', (req: Request, res: Response) => {
        const pathsToCheck = [
            path.join(process.cwd(), 'public'),
            path.join(process.cwd(), 'dist/public'),
            path.join(__dirname, '../../public'),
            path.join(__dirname, '../../../public'),
            path.join(__dirname, '../public')
        ];
        const results = pathsToCheck.map((p) => ({
            path: p,
            exists: fs.existsSync(p),
            contents: fs.existsSync(p) ? fs.readdirSync(p).slice(0, 5) : 'N/A'
        }));
        res.json({ cwd: process.cwd(), dirname: __dirname, results });
    });

    // Manejo de Errores (Debe ser el último)
    app.use(errorHandler);

    // Manejador 404 - Soporte HTML
    app.use((req: Request, res: Response) => {
        const message = 'Error 404: La ruta especificada no existe.';
        if (req.accepts('html')) {
            return res
                .status(404)
                .sendFile('404.html', { root: path.join(__dirname, '../../public') });
        }

        if (req.path.startsWith('/api') || req.path.startsWith('/twitch')) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(404).send(message);
        }

        res.status(404).json({ error: 'Not Found', message });
    });
};
