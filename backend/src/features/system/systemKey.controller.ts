import { Response } from 'express';
import * as authService from '../auth/auth.service';
import * as dbService from '../../core/database/dbService';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';
import { jsonError } from '../../core/utils/jsonResponse';
import { invalidateAllUserCaches } from '../../core/utils/cacheInvalidation';
import { invalidateAuthCache } from '../../core/middleware/authMiddleware';

import { AuthenticatedRequest } from '../../types/twitch';

export const regenerateKey = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    try {
        const apiUser = res.locals?.apiUser as { apiKey?: string } | undefined;
        const oldApiKey = apiUser?.apiKey;
        const newKey = await authService.regenerateApiKey(userId);

        await invalidateAllUserCaches(userId, {
            apiKey: oldApiKey,
            login: req.login,
            revokeApiKey: true
        });
        // Solo limpia caché en memoria; no revocar lp_sess (evita lockout 10 min en el panel).
        invalidateAuthCache(userId, { revokeSession: false });

        await dbService.addAuditLog('api_key_regenerated', userId, userId);

        res.json({ apiKey: newKey });
    } catch (e) {
        logger.error('Error regenerando key:', e);
        return jsonError(res, 500, MESSAGES.SYSTEM.REGENERATE_KEY_ERROR);
    }
};
