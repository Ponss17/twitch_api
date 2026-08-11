import { safeString } from '../../core/utils/validationHelpers';
import { Response } from 'express';
import * as cacheService from '../../core/database/cacheService';
import * as dbService from '../../core/database/dbService';
import { resolveCache } from '../../core/config/cacheTtl';
import { logger } from '../../core/utils/logger';
import { jsonError } from '../../core/utils/jsonResponse';
import { MESSAGES } from '../../core/config/messages';
import { AuthenticatedRequest } from '../../types/twitch';

export interface ViewerLeaderboardEntry {
    user_name: string;
    total: number;
    last_seen: string;
}

export const getViewerLeaderboard = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    const range = safeString(req.query.range) || 'today';
    const limit = Math.min(Number(req.query.limit) || 10, 25);

    try {
        const cacheKey = `cache:leaderboard:${userId}:${range}:${limit}`;
        const revision = await cacheService.getStatsRevision(userId);
        const cached = await cacheService.get<{ revision: number; data: ViewerLeaderboardEntry[] }>(cacheKey);
        if (revision >= 0 && cached?.revision === revision) return res.json(cached.data);

        const leaderboards = await dbService.getViewerLeaderboards(userId, limit);
        const leaderboard = range === 'today'
            ? leaderboards.leaderboardToday
            : leaderboards.leaderboardWeekly;

        const ttl = resolveCache('ACTIVITY_FEED', res.locals?.apiUser?.role, res.locals?.apiUser?.customCacheTtl);
        if (revision >= 0) await cacheService.set(cacheKey, { revision, data: leaderboard }, ttl);

        return res.json(leaderboard);
    } catch (e) {
        logger.error('Error fatal en getViewerLeaderboard:', e);
        return jsonError(res, 500, 'Error interno al obtener el leaderboard.');
    }
};
