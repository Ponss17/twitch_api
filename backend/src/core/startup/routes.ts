import { Application, Request, Response } from 'express';
import { CONFIG } from '../config/env';
import { globalRateLimiter, authRateLimiter } from '../middleware/redisRateLimiter';
import { apiKeyValidator } from '../middleware/apiKeyValidator';
import checkToken from '../middleware/authMiddleware';
import { isApiRoute, isJsonApiRoute } from '../utils/routeHelpers';
import authRoutes from '../../features/auth/auth.routes';
import apiRouter from '../../routes/index';
import { getRobotsTxt, getSitemapXml } from '../../features/system/seo.controller';
import { errorHandler } from '../middleware/errorMiddleware';
import { jsonError } from '../utils/jsonResponse';

export const configureRoutes = (app: Application) => {
    app.use((req, res, next) => {
        const isApi =
            req.path.startsWith('/api/') ||
            req.path.startsWith('/twitch/') ||
            req.path.startsWith('/auth');
        if (isApi) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Surrogate-Control', 'no-store');
        }
        next();
    });

    app.use(apiKeyValidator);
    app.use(checkToken);
    app.use(globalRateLimiter);

    app.use('/auth', authRateLimiter, authRoutes);
    app.use('/api/auth', authRateLimiter, authRoutes);

    app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
        const isConfigured = !!(CONFIG.TWITCH_CLIENT_ID && CONFIG.TWITCH_CLIENT_SECRET);
        res.json({
            status: isConfigured ? 'ok' : 'maintenance',
            timestamp: new Date().toISOString()
        });
    });

    app.get(['/robots.txt', '/api/robots.txt'], getRobotsTxt);
    app.get(['/sitemap.xml', '/api/sitemap.xml'], getSitemapXml);

    app.use('/api', apiRouter);
    app.use('/', apiRouter);

    app.use((req: Request, res: Response) => {
        const message = 'Error 404: La ruta especificada no existe.';

        if (isJsonApiRoute(req.path)) {
            return jsonError(res, 404, message, { code: 'NOT_FOUND' });
        }

        if (isApiRoute(req.path)) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.status(404).send(message);
        }

        res.status(404).json({ error: 'Not Found', message });
    });

    app.use(errorHandler);
};
