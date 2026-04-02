import { Application, Request, Response } from 'express';
import path from 'path';
import { CONFIG } from '../config/env';
import { globalRateLimiter, authRateLimiter } from '../middleware/redisRateLimiter';
import { apiKeyValidator } from '../middleware/apiKeyValidator';
import checkToken from '../middleware/authMiddleware';
import authRoutes from '../../features/auth/auth.routes';
import { loadAdminRouter } from '../../routes/adminProxy';
import apiRouter from '../../routes/index';
import { getRobotsTxt, getSitemapXml } from '../../features/system/seo.controller';
import { errorHandler } from '../middleware/errorMiddleware';
import { localOnly } from '../middleware/localOnly';

// El adminRouter es opcional: solo existe localmente (está en .gitignore)
const adminRouter = loadAdminRouter();

export const configurePageRoutes = (app: Application) => {
    // --- VISTAS Y RUTAS ESTATICAS (HTML) ---
    // Estas rutas se configuran ANTES de los estáticos para evitar conflictos de carpetas (redirects 301)

    app.get(['/docs', '/api/twitch/docs'], (req: Request, res: Response) => {
        res.sendFile(path.join(process.cwd(), 'public/docs.html'));
    });

    app.get(['/dashboard', '/api/twitch/dashboard'], (req: Request, res: Response) => {
        res.sendFile(path.join(process.cwd(), 'public/dashboard.html'));
    });

    app.get(['/sobre-la-api', '/api/twitch/sobre-la-api'], (req: Request, res: Response) => {
        res.sendFile(path.join(process.cwd(), 'public/sobre-la-api.html'));
    });

    app.get(['/admin', '/api/twitch/admin'], localOnly, (req: Request, res: Response) => {
        res.sendFile(path.join(process.cwd(), 'admin/login.html'));
    });

    app.get(
        ['/admin-dashboard', '/api/twitch/admin-dashboard'],
        localOnly,
        (req: Request, res: Response) => {
            res.sendFile(path.join(process.cwd(), 'admin/dashboard.html'));
        }
    );
    // SEO (Servidos como páginas/archivos)
    app.get(['/robots.txt', '/api/twitch/robots.txt'], getRobotsTxt);
    app.get(['/sitemap.xml', '/api/twitch/sitemap.xml'], getSitemapXml);
};

export const configureRoutes = (app: Application) => {
    // --- MIDDLEWARES Y CONFIGURACIÓN ---
    app.use((req, res, next) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        next();
    });

    app.use(apiKeyValidator);
    app.use(checkToken);
    app.use(globalRateLimiter);

    // Rutas de Admin (API) — solo local, solo si el módulo existe
    if (adminRouter) {
        app.use(
            ['/api/admin', '/api/twitch/admin', '/admin/api', '/admin'],
            localOnly,
            adminRouter
        );
    }

    // Rutas API/Twitch
    // Usamos montajes individuales para mayor claridad en Express
    app.use('/auth', authRateLimiter, authRoutes);
    app.use('/api/twitch/auth', authRateLimiter, authRoutes);
    app.use('/twitch/auth', authRateLimiter, authRoutes);

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
            version: process.env.npm_package_version || '2.9.4'
        });
    });

    // 404 Handler - catches unmatched routes
    app.use((req: Request, res: Response) => {
        const message = 'Error 404: La ruta especificada no existe.';
        if (req.accepts('html')) {
            return res
                .status(404)
                .sendFile('404.html', { root: path.join(process.cwd(), 'public') });
        }

        if (req.path.startsWith('/api') || req.path.startsWith('/twitch')) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(404).send(message);
        }

        res.status(404).json({ error: 'Not Found', message });
    });

    // Error Handler - must be last (4-param middleware)
    app.use(errorHandler);
};
