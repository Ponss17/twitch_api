import { Application } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { requestLogger } from '../middleware/errorMiddleware';
import { registerCacheInvalidator } from '../../features/auth/auth.service';
import { invalidateUserCache } from '../middleware/apiKeyValidator';

registerCacheInvalidator(invalidateUserCache);

export const configureMiddleware = (app: Application) => {
    app.set('trust proxy', 1);

    app.use(requestLogger);

    app.use(
        helmet({
            contentSecurityPolicy: {
                useDefaults: false,
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: [
                        "'self'",
                        "'unsafe-inline'",
                        "'unsafe-eval'",
                        'https://cdnjs.cloudflare.com',
                        'https://unpkg.com',
                        'https://*.twitch.tv',
                        'https://*.jtvnw.net',
                        'https://va.vercel-scripts.com',
                        'blob:'
                    ],
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
                        'blob:'
                    ],
                    connectSrc: [
                        "'self'",
                        'https://id.twitch.tv',
                        'https://api.twitch.tv',
                        'https://*.twitch.tv',
                        'wss://*.twitch.tv',
                        'https://va.vercel-scripts.com',
                        'blob:'
                    ],
                    objectSrc: ["'none'"],
                    frameSrc: ["'self'", 'https://id.twitch.tv', 'https://*.twitch.tv', 'blob:'],
                    workerSrc: ["'self'", 'blob:'],
                    childSrc: ["'self'", 'blob:']
                }
            },
            crossOriginEmbedderPolicy: false,
            // Stricter anti-sniffing and frame guarding
            noSniff: true,
            xssFilter: true,
            hidePoweredBy: true,
            frameguard: { action: 'deny' }
        })
    );

    app.use(
        cors({
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);

                const allowedOrigins = [
                    'https://www.losperris.site',
                    'https://losperris.site',
                    'http://localhost:3000',
                    'http://localhost:5173'
                ];

                if (allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }

                // Si hay origin y no es de la lista blanca, bloquear
                callback(new Error('Bloqueado por reglas de CORS de la API'));
            },
            credentials: true
        })
    );
    app.use(
        compression({
            threshold: 1024 // Solo comprimir respuestas mayores a 1KB
        })
    );
    app.use(express.json());
};
