import { Response } from 'express';
import * as dbService from '../../core/database/dbService';
import * as cacheService from '../../core/database/cacheService';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';
import { AuthenticatedRequest } from '../../types/twitch';
import { jsonError } from '../../core/utils/jsonResponse';

export const exportCheck = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    const key = `export_cooldown:${userId}`;

    try {
        const cachedExpiresAt = await cacheService.get<number>(key);
        if (cachedExpiresAt) {
            const remainingMins = Math.max(1, Math.ceil((cachedExpiresAt - Date.now()) / 60000));
            return jsonError(res, 429, `Debes esperar ${remainingMins} minuto${remainingMins > 1 ? 's' : ''} para generar otro reporte.`, { code: 'RATE_LIMITED' });
        }
        res.json({ success: true });
    } catch (e) {
        logger.error('Error checking export rate limit:', e);
        return jsonError(res, 500, 'Error al verificar limite de exportacion.');
    }
};

export const recordExportComplete = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    const key = `export_cooldown:${userId}`;
    const COOLDOWN_MINUTES = 4;

    try {
        await cacheService.set(key, Date.now() + COOLDOWN_MINUTES * 60000, COOLDOWN_MINUTES * 60);
        res.json({ success: true });
    } catch (e) {
        logger.error('Error setting export cooldown:', e);
        return jsonError(res, 500, 'Error interno del servidor.');
    }
};

export const updateSettings = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    const { timezone } = req.body;

    try {
        await dbService.updateUserTimezone(userId, timezone);
        res.json({ success: true });
    } catch (e) {
        logger.error('Error updating settings:', e);
        return jsonError(res, 500, 'Error al actualizar los ajustes del perfil.');
    }
};