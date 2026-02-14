import { Application } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { requestLogger } from '../middleware/errorMiddleware';

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
                        'blob:'
                    ],
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
};
