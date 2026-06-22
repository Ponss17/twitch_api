// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(root, '.env');
const fileEnv = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};
/** @param {string} key */
const env = (key) => process.env[key] || fileEnv[key] || '';

/** Mismas variables que el backend (.env) — inyectadas al cliente vía astro.config.mjs */
const supabaseUrl = env('SUPABASE_URL');
const supabaseAnonKey = env('SUPABASE_ANON_KEY');

/** En dev: no servir sw.js (evita SW interceptando deps de Vite). */
function devNoServiceWorker() {
    return {
        name: 'dev-no-service-worker',
        /** @param {any} server */
        configureServer(server) {
            server.middlewares.use(
                /** @param {any} req @param {any} res @param {() => void} next */
                (req, res, next) => {
                const url = req.url ?? '';
                if (url.includes('/sw.js')) {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.end('Service worker disabled in development');
                    return;
                }
                next();
            }
            );
        }
    };
}

/** Rutas Astro en la raíz — no deben ir al proxy del backend en dev */
const FRONTEND_EXACT = new Set([
    '/',
    '/dashboard',
    '/docs',
    '/sobre-la-api',
    '/privacidad',
    '/terminos',
    '/cookies',
    '/404',
    '/429',
    '/500',
    '/offline',
    '/sw.js',
    '/manifest.json',
    '/api/twitch',
    '/api/twitch/',
    '/api/twitch/dashboard',
    '/api/twitch/docs',
    '/api/twitch/sobre-la-api',
    '/api/twitch/privacidad',
    '/api/twitch/terminos',
    '/api/twitch/cookies',
    '/api/twitch/404',
    '/api/twitch/429',
    '/api/twitch/500',
    '/api/twitch/offline',
    '/api/twitch/sw.js',
    '/api/twitch/manifest.json'
]);

/** @param {string | undefined} url */
function isFrontendRoute(url) {
    const path = (url || '').split('?')[0];
    if (FRONTEND_EXACT.has(path)) return true;
    if (path.startsWith('/img/') || path.startsWith('/api/twitch/img/')) return true;
    if (path.startsWith('/api/twitch/_astro/')) return true;
    return false;
}

export default defineConfig({
    /** Estático en build — páginas en CDN (como el viejo serveHtml), solo API en serverless. */
    output: 'static',
    trailingSlash: 'always',
    /** Tras el proxy de losperris.dev, assets y rutas deben vivir bajo /api/twitch/ */
    base: '/api/twitch/',
    vite: {
        plugins: [tailwindcss(), devNoServiceWorker()],
        define: {
            'import.meta.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
            'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey)
        },
        optimizeDeps: {
            include: ['react', 'react-dom', 'tmi.js', '@supabase/supabase-js']
        },
        resolve: {
            alias: {
                '@': path.resolve(root, 'src')
            },
            dedupe: ['react', 'react-dom']
        },
        server: {
            proxy: {
                '/api/twitch': {
                    target: 'http://localhost:3000',
                    changeOrigin: true,
                    bypass(req) {
                        if (isFrontendRoute(req.url)) {
                            return req.url;
                        }
                    }
                },
                '/auth': { target: 'http://localhost:3000', changeOrigin: true },
                '/twitch': { target: 'http://localhost:3000', changeOrigin: true },
                '/health': { target: 'http://localhost:3000', changeOrigin: true }
            }
        }
    },
    integrations: [react()]
});
