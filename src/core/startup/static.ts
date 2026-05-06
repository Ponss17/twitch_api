import express, { Application } from 'express';
import path from 'path';
import { localOnly } from '../middleware/localOnly';

export const configureStatic = (app: Application) => {
    // Desarrollo: public/ en raíz | Producción (Vercel): dist/public/
    const publicPath = path.join(process.cwd(), 'public');
    const distPublicPath = path.join(process.cwd(), 'dist/public');

    const staticOptions = { fallthrough: true, extensions: ['html', 'js', 'css'] };
    const staticOptionsWithCache = {
        fallthrough: true,
        maxAge: '365d', // 1 año (Vercel CDN)
        immutable: true
    };

    // Imágenes y fuentes: caché larga (7 días)
    app.use(
        '/api/twitch/img',
        express.static(path.join(publicPath, 'img'), staticOptionsWithCache)
    );
    app.use('/img', express.static(path.join(publicPath, 'img'), staticOptionsWithCache));
    app.use(
        '/api/twitch/img',
        express.static(path.join(distPublicPath, 'img'), staticOptionsWithCache)
    );
    app.use('/img', express.static(path.join(distPublicPath, 'img'), staticOptionsWithCache));

    // Resto de assets (JS/CSS): caché media (1 día) para balancear frescura y performance
    const standardCache = { ...staticOptions, maxAge: '1d' };

    app.use('/api/twitch', express.static(publicPath, standardCache));
    app.use(express.static(publicPath, standardCache));

    app.use('/api/twitch', express.static(distPublicPath, standardCache));
    app.use(express.static(distPublicPath, standardCache));

    // Assets del panel admin (CSS, JS) — solo accesibles desde localhost
    // Los HTML se sirven via serveHtml() en routes.ts para inyectar el nonce CSP
    const adminStaticOptions = { fallthrough: true, extensions: ['js', 'css'] };
    const adminPath = path.join(process.cwd(), 'admin');
    app.use('/api/twitch/admin', localOnly, express.static(adminPath, adminStaticOptions));
    app.use('/admin', localOnly, express.static(adminPath, adminStaticOptions));

    // Interceptar 404 de assets estáticos para evitar que caigan al router
    app.use((req, res, next) => {
        const cleanPath = req.originalUrl.split('?')[0];
        // No interceptar rutas internas de Vercel
        if (cleanPath.includes('_vercel')) {
            return next();
        }
        if (/\.(webp|png|jpg|jpeg|gif|css|js|ico|svg|woff2?|map|json)$/i.test(cleanPath)) {
            return res.status(404).send('Not Found');
        }
        next();
    });
};
