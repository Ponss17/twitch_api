import { Application, Request } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { requestLogger } from '../middleware/errorMiddleware';
import { registerCacheInvalidator } from '../../features/auth/auth.service';
import { invalidateUserCache } from '../middleware/apiKeyValidator';
import { cspNonce } from '../middleware/cspNonce';
import { CONFIG } from '../config/env';

registerCacheInvalidator(invalidateUserCache);

export const configureMiddleware = (app: Application) => {
    app.set('trust proxy', 1);

    app.use(requestLogger);

    // Generar nonce único por request antes de Helmet para usarlo en la CSP
    app.use(cspNonce);

    app.use(
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
                        'https://cdnjs.cloudflare.com',
                        'https://unpkg.com',
                        'https://cdn.jsdelivr.net',
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
            noSniff: true,
            xssFilter: true,
            hidePoweredBy: true,
            frameguard: { action: 'deny' }
        })
    );

    app.use(
        cors((req: Request, callback) => {
            const origin = req.header('Origin');
            const host = req.get('host');

            if (!origin) return callback(null, { origin: true, credentials: true });

            const allowedOrigins = [
                'https://www.losperris.dev',
                'https://losperris.dev',
                'http://localhost:3000',
                'http://localhost:5173'
            ];

            const isVercel = origin.endsWith('.vercel.app');
            const isSameHost = host && origin.includes(host);

            let isBaseUrl = false;
            try {
                const baseUrlHost = new URL(CONFIG.BASE_URL).hostname;
                isBaseUrl = origin.includes(baseUrlHost);
            } catch (_e) {
                // ignore
            }

            if (allowedOrigins.includes(origin) || isVercel || isSameHost || isBaseUrl) {
                callback(null, { origin: true, credentials: true });
            } else {
                callback(new Error('Bloqueado por reglas de CORS de la API'));
            }
        })
    );
    app.use(
        compression({
            threshold: 1024 // Solo comprimir respuestas mayores a 1KB
        })
    );
    app.use(express.json());
};
