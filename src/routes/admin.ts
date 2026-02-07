import { Router } from 'express';
import { getAllUsers, updateUserStatus } from '../services/infrastructure/dbService';
import { logger } from '../utils/logger';

const router = Router();
const checkAdminPassword = (req: any, res: any, next: any) => {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const providedPassword = req.headers['x-admin-password'];

    if (!adminPassword) {
        logger.error('ADMIN_PASSWORD no está configurado en el servidor.');
        return res.status(500).json({ error: 'Configuración del servidor incompleta' });
    }

    if (providedPassword !== adminPassword) {
        logger.warn(`Intento de acceso admin fallido desde ${req.ip}`);
        return res.status(401).json({ error: 'No autorizado' });
    }
    next();
};

router.use((req, res, next) => {
    logger.info(`Admin Router Hit: ${req.method} ${req.originalUrl} - Path: ${req.path}`);
    next();
});

router.get('/health', (_req, res) => {
    res.json({ status: 'Admin Router OK', timestamp: new Date() });
});

router.use(checkAdminPassword);

router.get('/users', async (_req, res) => {
    try {
        const users = await getAllUsers();
        res.json(users);
    } catch (e) {
        logger.error('Error fetching users:', e);
        res.status(500).json({ error: 'Error interno' });
    }
});

router.post('/users/:userId/status', async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive, reason } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ error: 'isActive debe ser booleano' });
        }

        await updateUserStatus(userId, isActive, reason);
        logger.info(`Admin updated user ${userId} status: isActive=${isActive}`);
        res.json({ success: true });
    } catch (e) {
        logger.error('Error updating user status:', e);
        res.status(500).json({ error: 'Error actualizando usuario' });
    }
});

export default router;
