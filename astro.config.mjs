// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(root, '.env');
const fileEnv = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};
/** @param {string} key */
const env = (key) => process.env[key] || fileEnv[key] || '';

const supabaseUrl = env('SUPABASE_URL');
const supabaseAnonKey = env('SUPABASE_ANON_KEY');

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

const FRONTEND_EXACT = new Set([
    '/',
    '/dashboard',
    '/docs',
    '/sobre-la-api',
    '/legal',
    '/privacidad',
    '/terminos',
    '/cookies',
    '/404',
    '/429',
    '/500',
    '/offline',
    '/sw.js',
    '/manifest.json',
    '/overlay/roulette',
    '/overlay/trends'
]);

const DASHBOARD_TAB_SLUGS = new Set([
    'followage',
    'clips',
    'shoutout',
    'trends',
    'stalker',
    'magic8',
    'roulette',
    'russian',
    'duel',
    'profile',
    'feedback'
]);

/** @param {string} path */
function isDashboardTabRoute(path) {
    const base = '/dashboard';
    if (path === base || path === `${base}/`) return true;
    const prefix = `${base}/`;
    if (!path.startsWith(prefix)) return false;
    const segment = path.slice(prefix.length).split('/').filter(Boolean)[0];
    return DASHBOARD_TAB_SLUGS.has(segment);
}

/** @param {string | undefined} url */
function isFrontendRoute(url) {
    const path = (url || '').split('?')[0];
    if (FRONTEND_EXACT.has(path)) return true;
    if (isDashboardTabRoute(path)) return true;
    if (path.startsWith('/docs/')) return true;
    if (path.startsWith('/overlay/')) return true;
    if (path.startsWith('/img/')) return true;
    if (path.startsWith('/_astro/')) return true;
    return false;
}

export default defineConfig({
    output: 'static',
    // Evita que BASE_URL del backend (.env) se use como base de Vite/Astro en el build.
    // base no se debe definir como '/' porque rompe las rutas de Astro (crea //_astro/).
    site: 'https://ttv.losperris.dev',
    trailingSlash: 'always',
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
                '@': path.resolve(root, 'src'),
                '@contracts': path.resolve(root, 'backend/src/core/schemas')
            },
            dedupe: ['react', 'react-dom']
        },
        server: {
            proxy: {
                '/api': {
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
    integrations: [
        starlight({
            title: 'LosPerris API',
            tagline: 'Documentación de la API para streamers de Twitch',
            favicon: '/api/twitch/img/favicon.svg',
            disable404Route: true,
            defaultLocale: 'root',
            locales: {
                root: {
                    label: 'Español',
                    lang: 'es'
                }
            },
            components: {
                Head: './src/components/StarlightHead.astro',
                Header: './src/components/StarlightHeader.astro',
                SiteTitle: './src/components/StarlightSiteTitle.astro',
                ThemeSelect: './src/components/StarlightThemeSelect.astro',
                Sidebar: './src/components/StarlightSidebar.astro',
            },
            customCss: [
                './src/core/utils/starlight-theme.css',
            ],
            sidebar: [
                {
                    label: 'Guía',
                    items: [
                        { label: 'Introducción', link: '/docs/' },
                        { label: 'Inicio rápido', link: '/docs/inicio-rapido/' },
                    ]
                },
                {
                    label: 'Cuenta y panel',
                    items: [
                        { label: 'Panel de Control', link: '/docs/panel/' },
                        { label: 'Tu API Key', link: '/docs/auth/' },
                        { label: 'Perfil y Seguridad', link: '/docs/profile/' },
                        { label: 'Límites', link: '/docs/limits/' },
                    ]
                },
                {
                    label: 'Comandos',
                    items: [
                        { label: 'Followage', link: '/docs/comandos/followage/' },
                        { label: 'Clips', link: '/docs/comandos/clips/' },
                        { label: 'Shoutout', link: '/docs/comandos/shoutout/' },
                    ]
                },
                {
                    label: 'Herramientas',
                    items: [
                        { label: 'Tendencias', link: '/docs/herramientas/trends/' },
                        { label: 'Stalker', link: '/docs/herramientas/stalker/' },
                        { label: 'Ruleta', link: '/docs/herramientas/roulette/' },
                    ]
                },

                {
                    label: 'Minijuegos',
                    items: [
                        { label: 'Bola 8', link: '/docs/minijuegos/magic8/' },
                        { label: 'Ruleta Rusa', link: '/docs/minijuegos/russian/' },
                        { label: 'Duelo', link: '/docs/minijuegos/duel/' },
                    ]
                },
                {
                    label: 'Extras',
                    items: [
                        { label: 'Listar clips', link: '/docs/extras/get-clips/' },
                        { label: 'Ayuda', link: '/docs/extras/errores/' },
                    ]
                },
            ]
        }),
        react()
    ]
});
