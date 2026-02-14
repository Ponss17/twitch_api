import { Application, Request, Response } from 'express';
import path from 'path';
import { CONFIG } from '../config/env';
import rateLimiter, { authLimiter } from '../middleware/rateLimiter';
import { apiKeyValidator } from '../middleware/apiKeyValidator';
import authRoutes from '../routes/authRoutes';
import adminRouter from '../routes/admin';
import apiRouter from '../routes/index';
import { getRobotsTxt, getSitemapXml } from '../controllers/system/seoController';
import { errorHandler } from '../middleware/errorMiddleware';

export const configureRoutes = (app: Application) => {
    // --- VALIDACIÓN Y RATE LIMIT (PARA RUTAS DINÁMICAS) ---
    app.use(apiKeyValidator);
    app.use(rateLimiter);

    // --- VISTAS Y RUTAS ESTATICAS (HTML) ---
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

    // Admin Router
    app.use(['/api/admin', '/api/twitch/admin', '/admin/api', '/admin'], adminRouter);

    // SEO
    app.get(['/robots.txt', '/api/twitch/robots.txt'], getRobotsTxt);
    app.get(['/sitemap.xml', '/api/twitch/sitemap.xml'], getSitemapXml);

    // API/Twitch Routes
    // Usamos montajes individuales para mayor claridad en Express
    app.use('/auth', authLimiter, authRoutes);
    app.use('/api/twitch/auth', authLimiter, authRoutes);
    app.use('/twitch/auth', authLimiter, authRoutes);

    // Main API Router (Aggregates games, commands, dashboard, system)
    app.use('/api/twitch', apiRouter);
    app.use('/twitch', apiRouter);
    app.use('/', apiRouter);

    // Health Check
    app.get(['/health', '/api/twitch/health'], (req: Request, res: Response) => {
        const isConfigured = !!(CONFIG.TWITCH_CLIENT_ID && CONFIG.TWITCH_CLIENT_SECRET);
        res.json({
            status: isConfigured ? 'ok' : 'maintenance',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '2.9.4'
        });
    });

    // Error Handling (Must be last)
    app.use(errorHandler);

    // 404 Handler - HTML Support
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
