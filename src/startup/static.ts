import express, { Application } from 'express';
import path from 'path';

export const configureStatic = (app: Application) => {
    // Desarrollo: public/ en raíz | Producción (Vercel): dist/public/
    const publicPath = path.join(process.cwd(), 'public');
    const distPublicPath = path.resolve(__dirname, '../../dist/public');

    const staticOptions = { fallthrough: true, extensions: ['html', 'js', 'css'] };

    app.use('/api/twitch', express.static(publicPath, staticOptions));
    app.use(express.static(publicPath, staticOptions));

    app.use('/api/twitch', express.static(distPublicPath, staticOptions));
    app.use(express.static(distPublicPath, staticOptions));

    // Interceptar 404 de assets estáticos para evitar que caigan al router
    app.use((req, res, next) => {
        const cleanPath = req.originalUrl.split('?')[0];
        if (/\.(webp|png|jpg|jpeg|gif|css|js|ico|svg|woff2?|map|json)$/i.test(cleanPath)) {
            return res.status(404).send('Not Found');
        }
        next();
    });
};
