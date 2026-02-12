import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import {
    getAllUsers,
    updateUserStatus,
    resetUserApiKey,
    deleteUser,
    getUser,
    saveUser,
    isAdmin,
    addAdmin,
    removeAdmin,
    getAllAdmins,
    getUserByApiKey,
    getSystemLogs,
    clearSystemLogs
} from '../services/infrastructure/dbService';
import { logger } from '../utils/logger';

import { CONFIG } from '../config/env';

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

const authorizeAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const path = req.path;
    const isStatic = /\.(webp|png|jpg|jpeg|gif|css|js|ico|svg|woff2?|map|json)$/i.test(path);
    if (isStatic) return next();

    const sessionToken = req.headers['x-admin-password'];

    if (!sessionToken) {
        return res.status(401).json({ error: 'Inicia sesión como administrador' });
    }

    try {
        const user = await getUserByApiKey(sessionToken as string);

        if (!user) {
            return res.status(401).json({ error: 'Sesión inválida o expirada' });
        }

        const allowed = await isAdmin(user.userId);
        if (!allowed) {
            logger.warn(
                `🛑 Usuario no autorizado intentó acceder al panel: ${user.login} (${user.userId})`
            );
            return res.status(403).json({ error: 'No tienes permisos de administrador' });
        }

        res.locals.adminUser = user;
        next();
    } catch (e) {
        logger.error('Error in authorizeAdmin middleware:', e);
        res.status(500).json({ error: 'Error de autorización' });
    }
};

router.use((req, res, next) => {
    logger.info(`Admin Router Hit: ${req.method} ${req.originalUrl} - Path: ${req.path}`);
    next();
});

router.get('/health', (_req, res) => {
    res.json({ status: 'Admin Router OK', timestamp: new Date() });
});

router.get('/verify', loginLimiter, authorizeAdmin, (_req, res) => {
    res.json({ success: true, message: 'Authenticated', user: res.locals.adminUser.displayName });
});

router.use(adminApiLimiter);
router.use(authorizeAdmin);

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

router.post('/users/:userId/rate-limit', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit } = req.body;

        if (typeof limit !== 'number' || limit < 0) {
            return res.status(400).json({ error: 'Límite debe ser un número positivo' });
        }

        const user = await getUser(userId);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        user.customRateLimit = limit;
        if (limit === 0) delete user.customRateLimit; // 0 o null vuelve al default (120)

        await saveUser(user);
        logger.info(`Admin updated rate limit for user ${userId}: ${limit}`);
        res.json({ success: true, limit });
    } catch (e) {
        logger.error('Error updating rate limit:', e);
        res.status(500).json({ error: 'Error actualizando límite' });
    }
});

router.get('/stats/global', async (_req, res) => {
    try {
        const users = await getAllUsers();
        const totalUsers = users.length;
        const activeUsers = users.filter((u) => u.isActive !== false).length;
        const totalRequests = users.reduce((sum, u) => sum + (u.totalRequests || 0), 0);

        const commandStats: Record<string, number> = {};
        users.forEach((u) => {
            if (u.stats) {
                Object.entries(u.stats).forEach(([cmd, count]) => {
                    commandStats[cmd] = (commandStats[cmd] || 0) + (count as number);
                });
            }
        });

        res.json({
            totalUsers,
            activeUsers,
            totalRequests,
            commandStats,
            lastUpdate: new Date().toISOString()
        });
    } catch (e) {
        logger.error('Error fetching global stats:', e);
        res.status(500).json({ error: 'Error al obtener estadísticas globales' });
    }
});

router.get('/system/status', async (_req, res) => {
    try {
        const startTime = Date.now();

        let kvStatus = 'error';
        let kvLatency = 0;
        try {
            const kvStart = Date.now();
            await getAllUsers();
            kvLatency = Date.now() - kvStart;
            kvStatus = 'ok';
        } catch (_e) {
            kvStatus = 'error';
        }

        const twitchStatus = 'ok';
        const groqStatus = CONFIG.GROQ_API_KEY ? 'ok' : 'maintenance';

        res.json({
            services: {
                database: { status: kvStatus, latency: `${kvLatency}ms` },
                twitch_api: { status: twitchStatus },
                ai_engine: { status: groqStatus }
            },
            env: {
                node_env: process.env.NODE_ENV,
                base_url: CONFIG.BASE_URL
            },
            totalRuntime: `${Date.now() - startTime}ms`
        });
    } catch (e) {
        logger.error('Error in system status:', e);
        res.status(500).json({ error: 'Error al verificar salud del sistema' });
    }
});

// ==========================================
// Gestión de Admins
// ==========================================

router.get('/admins', async (_req, res) => {
    try {
        const adminIds = await getAllAdmins();
        const admins = [];
        for (const id of adminIds) {
            const user = await getUser(id);
            if (user)
                admins.push({
                    userId: user.userId,
                    login: user.login,
                    displayName: user.displayName
                });
        }
        res.json({ admins, rootId: CONFIG.ADMIN_ROOT_ID });
    } catch (_e) {
        res.status(500).json({ error: 'Error al listar administradores' });
    }
});

router.post('/admins', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'ID de usuario requerido' });

        const user = await getUser(userId);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado en el sistema' });

        await addAdmin(userId);
        res.json({ success: true });
    } catch (_e) {
        res.status(500).json({ error: 'Error al añadir administrador' });
    }
});

router.delete('/admins/:userId', authorizeAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        if (userId === CONFIG.ADMIN_ROOT_ID) {
            return res.status(403).json({ error: 'No se puede eliminar al Admin Root' });
        }
        await removeAdmin(userId);
        res.json({ success: true });
    } catch (_error) {
        res.status(500).json({ error: 'Error al eliminar administrador' });
    }
});

router.get('/logs', authorizeAdmin, async (req, res) => {
    try {
        const logs = await getSystemLogs();
        res.json(logs);
    } catch (_error) {
        res.status(500).json({ error: 'Error al obtener logs' });
    }
});

router.post('/logs/clear', authorizeAdmin, async (req, res) => {
    try {
        await clearSystemLogs();
        res.json({ success: true });
    } catch (_error) {
        res.status(500).json({ error: 'Error al limpiar logs' });
    }
});

export default router;
