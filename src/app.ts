import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import { CONFIG } from './config/env';
import rateLimiter, { authLimiter } from './middleware/rateLimiter';
import { apiKeyValidator } from './middleware/apiKeyValidator';
import authRoutes from './routes/authRoutes';
import apiRoutes from './routes/apiRoutes';
import adminRouter from './routes/admin';
import { getRobotsTxt, getSitemapXml } from './controllers/system/seoController';
import { errorHandler, requestLogger } from './middleware/errorMiddleware';

const app: Application = express();

app.set('trust proxy', 1);

// Middlewares Base
app.use(requestLogger);
app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: false,
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    'https://cdnjs.cloudflare.com',
                    'https://unpkg.com',
                    'https://*.twitch.tv',
                    'https://*.jtvnw.net',
                    'blob:'
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    'https://fonts.googleapis.com',
                    'https://cdnjs.cloudflare.com'
                ],
                fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
                imgSrc: ["'self'", 'data:', 'https://*.jtvnw.net', 'https://*.twitch.tv', 'blob:'],
                connectSrc: [
                    "'self'",
                    'https://id.twitch.tv',
                    'https://api.twitch.tv',
                    'https://*.twitch.tv',
                    'wss://*.twitch.tv',
                    'blob:'
                ],
                objectSrc: ["'none'"],
                frameSrc: ["'self'", 'https://id.twitch.tv', 'https://*.twitch.tv', 'blob:'],
                workerSrc: ["'self'", 'blob:'],
                childSrc: ["'self'", 'blob:']
            }
        },
        crossOriginEmbedderPolicy: false
    })
);

app.use(cors());
app.use(compression());
app.use(express.json());

// Vistas y Panel de Administración (Definidos ANTES de los estáticos para evitar conflictos de redirección)
app.get(['/docs', '/api/twitch/docs'], (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/docs.html'));
});

app.get(['/dashboard', '/api/twitch/dashboard'], (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get(['/admin', '/api/twitch/admin'], (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/admin/login.html'));
});

app.get(['/admin-dashboard', '/api/twitch/admin-dashboard'], (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/admin/dashboard.html'));
});

// Admin Routes
app.use('/api/admin', adminRouter);
app.use('/api/twitch/admin', adminRouter);
app.use('/admin/api', adminRouter);
app.use('/admin', adminRouter); //

// SEO
app.get(['/robots.txt', '/api/twitch/robots.txt'], getRobotsTxt);
app.get(['/sitemap.xml', '/api/twitch/sitemap.xml'], getSitemapXml);

// Estáticos
const publicPaths = [
    path.join(process.cwd(), 'public'),
    path.join(process.cwd(), 'dist/public'),
    path.join(__dirname, '../public')
];

// Try to serve from all potential locations (express.static skips if not found)
publicPaths.forEach((publicPath) => {
    app.use('/api/twitch', express.static(publicPath));
    app.use(express.static(publicPath));
});

// Rate Limiting Global
app.use(apiKeyValidator);
app.use(rateLimiter);

// Rutas de Comandos y API
app.use('/auth', authLimiter, authRoutes);
app.use('/api/twitch/auth', authLimiter, authRoutes);
app.use('/twitch/auth', authLimiter, authRoutes);

app.use('/api/twitch', apiRoutes);
app.use('/twitch', apiRoutes);
app.use('/', apiRoutes);

// Health Check
app.get(['/health', '/api/twitch/health'], (req: Request, res: Response) => {
    const isConfigured = !!(CONFIG.TWITCH_CLIENT_ID && CONFIG.TWITCH_CLIENT_SECRET);
    res.json({
        status: isConfigured ? 'ok' : 'maintenance',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '2.6.0'
    });
});

app.use(errorHandler);

app.use((req: Request, res: Response) => {
    const message = 'Error 404: La ruta especificada no existe.';
    if (req.path.startsWith('/api') || req.path.startsWith('/twitch')) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(404).send(message);
    }
    res.status(404).sendFile(path.join(__dirname, '../public/404.html'), (err) => {
        if (err) res.status(404).json({ error: 'Not Found', message });
    });
});

export default app;
