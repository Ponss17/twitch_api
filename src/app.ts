import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import { CONFIG } from './config/env';
import rateLimiter from './middleware/rateLimiter';
import authRoutes from './routes/authRoutes';
import apiRoutes from './routes/apiRoutes';

const app: Application = express();

app.set('trust proxy', 1);

app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://unpkg.com", "https://*.twitch.tv", "https://*.jtvnw.net", "blob:"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https://*.jtvnw.net", "https://*.twitch.tv", "blob:"],
            connectSrc: ["'self'", "https://id.twitch.tv", "https://api.twitch.tv", "https://*.twitch.tv", "wss://*.twitch.tv", "blob:"],
            objectSrc: ["'none'"],
            frameSrc: ["'self'", "https://id.twitch.tv", "https://*.twitch.tv", "blob:"],
            workerSrc: ["'self'", "blob:"],
            childSrc: ["'self'", "blob:"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.url.startsWith('/api/twitch')) {
        req.url = req.url.replace('/api/twitch', '') || '/';
    }
    next();
});

app.use(express.static(path.join(__dirname, '../public')));

app.get('/docs', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/docs.html'));
});

app.get('/dashboard', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.use(rateLimiter);

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

app.get('/health', (req: Request, res: Response) => {
    const isConfigured = !!(CONFIG.TWITCH_CLIENT_ID && CONFIG.TWITCH_CLIENT_SECRET);
    res.json({
        status: isConfigured ? 'ok' : 'maintenance',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '2.0.0 (TS)'
    });
});

export default app;
