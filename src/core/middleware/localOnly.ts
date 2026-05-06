import { Request, Response, NextFunction } from 'express';

/**
 * Middleware que permite el acceso solo desde localhost (127.0.0.1 o ::1).
 * Usa socket.remoteAddress en vez de req.ip para evitar header spoofing con trust proxy.
 */
export const localOnly = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.socket?.remoteAddress || '';
    const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';

    if (!isLocal) {
        return res.status(404).send('Not Found');
    }

    next();
};
