import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import { CONFIG } from './config/env';
import rateLimiter from './middleware/rateLimiter';
import authRoutes from './routes/authRoutes';
import apiRoutes from './routes/apiRoutes';

const app: Application = express();

app.set('trust proxy', 1);

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors());
app.use(express.json());
app.use(rateLimiter);

app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[DEBUG] Incoming: ${req.method} ${req.url}`);
    if (req.url.startsWith('/api/twitch')) {
        req.url = req.url.replace('/api/twitch', '') || '/';
        console.log(`[DEBUG] Stripped: ${req.url}`);
    }
    next();
});

app.use(express.static(path.join(__dirname, '../public')));

app.get('/docs', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/docs.html'));
});

app.get('/status', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/app_status.html'));
});

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
