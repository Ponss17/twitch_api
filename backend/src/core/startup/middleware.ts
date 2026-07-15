import { Application, Request, Response, NextFunction } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { requestLogger } from '../middleware/errorMiddleware';
import { registerCacheInvalidator } from '../../features/auth/auth.service';
import { invalidateUserCache } from '../middleware/apiKeyValidator';
import { cspNonce } from '../middleware/cspNonce';
import { ALLOWED_ORIGINS } from '../config/origins';

registerCacheInvalidator(invalidateUserCache);

// Helper: ejecuta el middleware solo si NO es un asset estático
const skipForAssets = (
    middleware: (req: Request, res: Response, next: NextFunction) => void
): ((req: Request, res: Response, next: NextFunction) => void) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (/\.(css|js|png|jpg|jpeg|gif|webp|ico|svg|woff2?|map|json)$/i.test(req.path)) {
            return next();
        }
        middleware(req, res, next);
    };
};

export const configureMiddleware = (app: Application) => {
    app.set('trust proxy', 1);

    // Fast Drop: Rechazo inmediato de escáneres y bots basura para no gastar CPU ni Redis
    app.use((req, res, next) => {
        const url = req.url.toLowerCase();
        if (
            url.includes('.php') ||
            url.includes('.env') ||
            url.includes('.git') ||
            url.includes('wp-admin') ||
            url.includes('wp-login') ||
            url.endsWith('.sql') ||
            url.endsWith('.bak') ||
            url.endsWith('.zip')
        ) {
            return res.status(403).send('Forbidden');
        }
        next();
    });

    // Los middlewares pesados se saltan para assets estáticos que llegan por el rewrite catch-all
    app.use(skipForAssets(requestLogger));
    app.use(skipForAssets(express.json()));

    // Generar nonce único por request antes de Helmet para usarlo en la CSP
    app.use(skipForAssets(cspNonce));

    app.use(
        skipForAssets(
            helmet({
                contentSecurityPolicy: {
                    useDefaults: false,
                    directives: {
                        defaultSrc: ["'self'"],
                        scriptSrc: [
                            "'self'",
                            // Nonce dinámico por request: elimina la necesidad de 'unsafe-inline'
                            (_req, res) =>
                                `'nonce-${(res as unknown as { locals: { cspNonce: string } }).locals.cspNonce}'`,
                            // Permite scripts inyectados dinámicamente por código con nonce válido (Speed Insights SDK)
                            "'strict-dynamic'",
                            'https://cdnjs.cloudflare.com',
                            'https://unpkg.com',
                            'https://cdn.jsdelivr.net',
                            'https://*.twitch.tv',
                            'https://*.jtvnw.net',
                            'https://va.vercel-scripts.com',
                            'https://*.google-analytics.com',
                            'https://www.google-analytics.com',
                            'blob:'
                        ],
                        scriptSrcAttr: ["'none'"],
                        styleSrc: [
                            "'self'",
                            "'unsafe-inline'",
                            'https://fonts.googleapis.com',
                            'https://cdnjs.cloudflare.com'
                        ],
                        fontSrc: [
                            "'self'",
                            'https://fonts.gstatic.com',
                            'https://cdnjs.cloudflare.com'
                        ],
                        imgSrc: [
                            "'self'",
                            'data:',
                            'https://*.jtvnw.net',
                            'https://*.twitch.tv',
                            'https://flagcdn.com',
                            'https://*.flagcdn.com',
                            'https://*.google-analytics.com',
                            'blob:'
                        ],
                        connectSrc: [
                            "'self'",
                            'https://id.twitch.tv',
                            'https://api.twitch.tv',
                            'https://*.twitch.tv',
                            'wss://*.twitch.tv',
                            'https://*.supabase.co',
                            'wss://*.supabase.co',
                            'https://va.vercel-scripts.com',
                            'https://vitals.vercel-insights.com',
                            'https://*.google-analytics.com',
                            'https://www.google-analytics.com',
                            'blob:'
                        ],
                        objectSrc: ["'none'"],
                        frameSrc: [
                            "'self'",
                            'https://id.twitch.tv',
                            'https://*.twitch.tv',
                            'blob:'
                        ],
                        workerSrc: ["'self'", 'blob:'],
                        childSrc: ["'self'", 'blob:']
                    }
                },
                crossOriginEmbedderPolicy: false,
                crossOriginResourcePolicy: false,
                noSniff: true,
                xssFilter: true,
                hidePoweredBy: true,
                frameguard: { action: 'deny' },
                hsts: {
                    maxAge: 31536000,
                    includeSubDomains: true,
                    preload: true
                },
                referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
            })
        )
    );

    // Permissions Policy: Restringir acceso a hardware innecesario
    app.use(
        skipForAssets((req, res, next) => {
            res.setHeader(
                'Permissions-Policy',
                'camera=(), microphone=(), geolocation=(), interest-cohort=()'
            );
            next();
        })
    );

    app.use(
        skipForAssets(
            cors((req: Request, callback) => {
                const origin = req.header('Origin');
                const host = req.get('host');

                // Sin Origin: bots (Nightbot, StreamElements, curl) o peticiones server-to-server.
                // Permitir SIN credentials (no hay cookies ni session en esas peticiones).
                // Esto es comportamiento intencional y correcto — no es un bypass de seguridad.
                if (!origin) return callback(null, { origin: true, credentials: false });

                let safeOrigin: URL | null = null;
                try {
                    safeOrigin = new URL(origin);
                } catch {
                    return callback(new Error('Bloqueado por reglas de CORS de la API'));
                }

                const isSameHost = host && safeOrigin.host === host;

                if (ALLOWED_ORIGINS.includes(origin) || isSameHost) {
                    callback(null, { origin: true, credentials: true });
                } else {
                    callback(null, { origin: false });
                }
            })
        )
    );
    app.use(
        skipForAssets(
            compression({
                threshold: 1024 // Solo comprimir respuestas mayores a 1KB
            })
        )
    );
};
