import { Application, Request, Response } from 'express';
import { CONFIG } from '../config/env';
import { globalRateLimiter, authRateLimiter } from '../middleware/redisRateLimiter';
import { apiKeyValidator } from '../middleware/apiKeyValidator';
import checkToken from '../middleware/authMiddleware';
import { isApiRoute } from '../utils/routeHelpers';
import authRoutes from '../../features/auth/auth.routes';
import { loadAdminRouter } from '../../routes/adminProxy';
import apiRouter from '../../routes/index';
import { getRobotsTxt, getSitemapXml } from '../../features/system/seo.controller';
import { errorHandler } from '../middleware/errorMiddleware';
import { localOnly } from '../middleware/localOnly';
import { serveHtml } from '../utils/serveHtml';

// El adminRouter es opcional: solo existe localmente (está en .gitignore)
const adminRouter = loadAdminRouter();

export const configurePageRoutes = (app: Application) => {
    // --- VISTAS Y RUTAS ESTATICAS (HTML) ---
    // Estas rutas se configuran ANTES de los estáticos para evitar conflictos de carpetas (redirects 301)

    app.get(['/', '/api/twitch/'], async (_req: Request, res: Response) => {
        await serveHtml(res, 'public/index.html');
    });

    app.get(['/docs', '/api/twitch/docs'], async (_req: Request, res: Response) => {
        await serveHtml(res, 'public/docs.html');
    });

    app.get(['/dashboard', '/api/twitch/dashboard'], async (_req: Request, res: Response) => {
        await serveHtml(res, 'public/dashboard.html');
    });

    app.get(['/sobre-la-api', '/api/twitch/sobre-la-api'], async (_req: Request, res: Response) => {
        await serveHtml(res, 'public/sobre-la-api.html');
    });

    // Admin routes — localOnly + nonce injection via serveHtml
    // Se cubren todas las variantes (con y sin extensión .html) para evitar
    // que express.static sirva los HTML sin inyectar el nonce CSP
    app.get(
        [
            '/admin',
            '/admin/login',
            '/admin/login.html',
            '/api/twitch/admin',
            '/api/twitch/admin/login',
            '/api/twitch/admin/login.html'
        ],
        localOnly,
        async (_req: Request, res: Response) => {
            await serveHtml(res, 'admin/login.html');
        }
    );

    app.get(
        [
            '/admin-dashboard',
            '/admin/dashboard',
            '/admin/dashboard.html',
            '/api/twitch/admin-dashboard',
            '/api/twitch/admin/dashboard',
            '/api/twitch/admin/dashboard.html'
        ],
        localOnly,
        async (_req: Request, res: Response) => {
            await serveHtml(res, 'admin/dashboard.html');
        }
    );
    // SEO (Servidos como páginas/archivos)
    app.get(['/robots.txt', '/api/twitch/robots.txt'], getRobotsTxt);
    app.get(['/sitemap.xml', '/api/twitch/sitemap.xml'], getSitemapXml);
};

export const configureRoutes = (app: Application) => {
    // --- MIDDLEWARES Y CONFIGURACIÓN ---
    app.use((req, res, next) => {
        const isApiRoute =
            req.path.startsWith('/api/') ||
            req.path.startsWith('/twitch/') ||
            req.path.startsWith('/auth');
        if (isApiRoute) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Surrogate-Control', 'no-store');
        }
        next();
    });

    // Rutas de Admin (API) — solo local, solo si el módulo existe
    // Se montan ANTES de los validadores globales para que el login local funcione
    if (adminRouter) {
        app.use(
            ['/api/admin', '/api/twitch/admin', '/admin/api', '/admin'],
            localOnly,
            adminRouter
        );
    }

    app.use(apiKeyValidator);
    app.use(checkToken);
    app.use(globalRateLimiter);

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
            timestamp: new Date().toISOString()
        });
    });

    // 404 Handler - catches unmatched routes
    app.use(async (req: Request, res: Response) => {
        const message = 'Error 404: La ruta especificada no existe.';
        if (req.accepts('html')) {
            return await serveHtml(res, 'public/404.html', 404);
        }

        if (isApiRoute(req.path)) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(404).send(message);
        }

        res.status(404).json({ error: 'Not Found', message });
    });

    // Error Handler - must be last (4-param middleware)
    app.use(errorHandler);
};
