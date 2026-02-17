import express, { Application } from 'express';
import path from 'path';

export const configureStatic = (app: Application) => {
    const publicPaths = [
        path.join(process.cwd(), 'public'),
        path.join(process.cwd(), 'dist/public'),
        path.join(__dirname, '../../public'),
        path.join(__dirname, '../../../public'),
        path.join(__dirname, '../public'),
        path.resolve(__dirname, '../../dist/public')
    ];

    publicPaths.forEach((publicPath) => {
        app.use('/api/twitch', express.static(publicPath, { fallthrough: true }));
        app.use(express.static(publicPath, { fallthrough: true }));
    });

    app.use((req, res, next) => {
        const cleanPath = req.originalUrl.split('?')[0];
        if (/\.(webp|png|jpg|jpeg|gif|css|js|ico|svg|woff2?|map|json|webp)$/i.test(cleanPath)) {
            return res.status(404).send('Not Found');
        }
        next();
    });
};
