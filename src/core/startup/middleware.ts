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
                    scriptSrcAttr: ["'self'", "'unsafe-inline'"],
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
                        'https://va.vercel-scripts.com',
                        'https://vitals.vercel-insights.com',
                        'https://twitch-api-smoky.vercel.app',
                        'https://*.google-analytics.com',
                        'https://www.google-analytics.com',
                        'blob:'
                    ],
                    objectSrc: ["'none'"],
                    frameSrc: ["'self'", 'https://id.twitch.tv', 'https://*.twitch.tv', 'blob:'],
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
    );

    // Permissions Policy: Restringir acceso a hardware innecesario
    app.use((req, res, next) => {
        res.setHeader(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), interest-cohort=()'
        );
        next();
    });

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

            let safeOrigin: URL | null = null;
            try {
                safeOrigin = new URL(origin);
            } catch {
                return callback(new Error('Bloqueado por reglas de CORS de la API'));
            }

            const isSameHost =
                host && (safeOrigin.host === host || safeOrigin.host.endsWith(`.${host}`));

            let isBaseUrl = false;
            try {
                const baseUrlHost = new URL(CONFIG.BASE_URL).hostname;
                isBaseUrl =
                    safeOrigin.hostname === baseUrlHost ||
                    safeOrigin.hostname.endsWith(`.${baseUrlHost}`);
            } catch (_e) {
                // ignore
            }

            if (allowedOrigins.includes(origin) || isSameHost || isBaseUrl) {
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
