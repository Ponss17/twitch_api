import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    getAllUsers,
    updateUserStatus,
    resetUserApiKey,
    deleteUser
} from '../services/infrastructure/dbService';
import { logger } from '../utils/logger';

const router = Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: {
        error: 'Demasiados intentos de inicio de sesión. Inténtalo de nuevo en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const adminApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false
});

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

router.get('/verify', loginLimiter, checkAdminPassword, (_req, res) => {
    res.json({ success: true, message: 'Authenticated' });
});

router.use(adminApiLimiter);
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

router.post('/users/:userId/reset-key', async (req, res) => {
    try {
        const { userId } = req.params;
        const newKey = await resetUserApiKey(userId);
        logger.info(`Admin reset API key for user ${userId}`);
        res.json({ success: true, newKey });
    } catch (e) {
        logger.error('Error resetting API key:', e);
        res.status(500).json({ error: 'Error reseteando API Key' });
    }
});

router.delete('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        await deleteUser(userId);
        logger.info(`Admin deleted user ${userId}`);
        res.json({ success: true });
    } catch (e) {
        logger.error('Error deleting user:', e);
        res.status(500).json({ error: 'Error eliminando usuario' });
    }
});

export default router;
