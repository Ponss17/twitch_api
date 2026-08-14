import { Application, Request, Response } from 'express';
import { CONFIG } from '../config/env';
import { preAuthRateLimiter } from '../middleware/redisRateLimiter';
import { apiKeyValidator } from '../middleware/apiKeyValidator';
import checkToken from '../middleware/authMiddleware';
import { isApiRoute, isJsonApiRoute } from '../utils/routeHelpers';
import authRoutes from '../../features/auth/auth.routes';
import apiRouter from '../../routes/index';
import { getRobotsTxt, getSitemapXml } from '../../features/system/seo.controller';
import { getPublicUsers } from '../../features/system/systemPublicUsers.controller';
import { errorHandler } from '../middleware/errorMiddleware';
import { jsonError } from '../utils/jsonResponse';
import { stripTwitchPrefix } from '../middleware/twitchPrefix';
import { overlayScopeGuard } from '../middleware/overlayScope';

/**
 * Composer HTTP único (aliases intencionales — no quitar sin auditar bots/OAuth).
 *
 * Montajes:
 * - API: `/api/*` (frontend + bots) y `/` (tras `stripTwitchPrefix` de `/twitch/*`)
 * - Auth: `/api/auth/*` (preferido) y `/auth/*` (legacy / consola Twitch) → features/auth
 * - Health: `/health` y `/api/health`
 * - SEO: `/robots.txt` + `/sitemap.xml` (+ `/api/...`) → features/system/seo.controller
 * - Features API: `routes/index.ts` → minigames, dashboard(+tools), system, commands
 */
export const configureRoutes = (app: Application) => {
    app.use(stripTwitchPrefix);
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

    app.get(['/health', '/api/health'], preAuthRateLimiter, /* codeql[js/missing-rate-limiting] */ (_req: Request, res: Response) => {
        const isConfigured = !!(CONFIG.TWITCH_CLIENT_ID && CONFIG.TWITCH_CLIENT_SECRET);
        res.json({
            status: isConfigured ? 'ok' : 'maintenance',
            timestamp: new Date().toISOString()
        });
    });

    app.get(['/robots.txt', '/api/robots.txt'], preAuthRateLimiter, /* codeql[js/missing-rate-limiting] */ getRobotsTxt);
    app.get(['/sitemap.xml', '/api/sitemap.xml'], preAuthRateLimiter, /* codeql[js/missing-rate-limiting] */ getSitemapXml);
    app.get(['/api/system/public-users', '/system/public-users'], preAuthRateLimiter, /* codeql[js/missing-rate-limiting] */ getPublicUsers);

    app.use(preAuthRateLimiter);
    // codeql[js/missing-rate-limiting] Redis pre-auth limiter is applied above
    app.use(apiKeyValidator);
    // codeql[js/missing-rate-limiting] Redis pre-auth limiter is applied above
    app.use(checkToken);
    // codeql[js/missing-rate-limiting] Feature routes apply post-auth Redis quotas
    app.use(overlayScopeGuard);

    // codeql[js/missing-rate-limiting] Redis pre-auth limiter is applied globally above
    app.use('/auth', authRoutes);
    // codeql[js/missing-rate-limiting] Redis pre-auth limiter is applied globally above
    app.use('/api/auth', authRoutes);

    // codeql[js/missing-rate-limiting] Redis pre-auth limiter is applied globally above
    app.use('/api', apiRouter);
    // codeql[js/missing-rate-limiting] Redis pre-auth limiter is applied globally above
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
