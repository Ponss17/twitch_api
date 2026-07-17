import { Response } from 'express';
import * as cacheService from '../../core/database/cacheService';
import * as apiService from '../twitch/twitch.service';
import { ownerScopedCacheKey, resolveCache } from '../../core/config/cacheTtl';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';
import { AuthenticatedRequest } from '../../types/twitch';
import { jsonError } from '../../core/utils/jsonResponse';
import { trackRequest } from '../../core/utils/tracking';
import { withTwitchAuth } from '../../core/utils/twitchAuthHelpers';

export const getClips = async (req: AuthenticatedRequest, res: Response) => {
    const channel = req.query.channel as string;
    const limitNum = parseInt(req.query.limit as string, 10) || 20;
    const userId = req.userId;

    const result = await trackRequest(
        userId,
        { type: 'other', user: channel, metadata: { action: 'Dashboard Clips' }, skipActivityLog: true, skipRequestCount: true },
        async () => {
            const cacheKey = ownerScopedCacheKey(userId, `cache:cmd:getClips:channel:${channel}:limit:${limitNum}`);
            const cached = await cacheService.get(cacheKey);
            if (cached) return cached;

            return withTwitchAuth(
                req,
                res,
                async (token) => {
                    const apiResult = await apiService.getClips(channel, limitNum, token);
                    await cacheService.set(
                        cacheKey,
                        apiResult,
                        resolveCache('CLIPS', res.locals.apiUser?.role, res.locals.apiUser?.customCacheTtl)
                    );
                    return apiResult;
                },
                'getClips'
            );
        },
        req
    );

    if (result) return res.json(result);
    if (!res.headersSent) return jsonError(res, 404, MESSAGES.DASHBOARD.CLIPS_ERROR, { code: 'NOT_FOUND' });
};

export const getChatters = async (req: AuthenticatedRequest, res: Response) => {
    const channel = req.query.channel as string;
    const eligibilityRaw = req.query.eligibility as string | undefined;
    const eligibility = apiService.parseEligibilityQuery(eligibilityRaw);
    const userId = req.userId;

    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    const source = req.query.source as string | undefined;
    const isRoulette = source === 'roulette';

    const result = await trackRequest(
        userId,
        { type: 'stalker', user: channel, incrementStat: isRoulette ? undefined : 'stalker', skipActivityLog: isRoulette },
        async () => {
            const cacheKey = ownerScopedCacheKey(
                userId,
                `cache:cmd:getChatters:channel:${channel}:eligibility:${eligibilityRaw ?? 'all'}`
            );
            const cached = await cacheService.get(cacheKey);
            if (cached) return cached;

            return withTwitchAuth(
                req,
                res,
                async (token) => {
                    const broadcasterId = await apiService.getUserId(channel, token);
                    const chatters = await apiService.getChatters(broadcasterId, userId, token);
                    const payload = await apiService.filterAndAnnotateChatters(
                        chatters,
                        broadcasterId,
                        token,
                        eligibility
                    );
                    await cacheService.set(
                        cacheKey,
                        payload,
                        resolveCache('CHATTERS', res.locals.apiUser?.role, res.locals.apiUser?.customCacheTtl)
                    );
                    return payload;
                },
                'getChatters'
            );
        },
        req
    );

    if (result) return res.json(result);
    if (!res.headersSent) return jsonError(res, 404, MESSAGES.DASHBOARD.CHATTERS_ERROR, { code: 'NOT_FOUND' });
};

export const trackToolUsage = async (req: AuthenticatedRequest, res: Response) => {
    const { tool } = req.body as { tool: 'trends' | 'stalker' | 'roulette' };
    const userId = req.userId;

    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    try {
        await trackRequest(userId, { type: tool, user: req.login || 'User', incrementStat: tool }, async () => ({ success: true }), req);
        res.json({ success: true });
    } catch (e) {
        logger.error('Error tracking tool usage:', e);
        return jsonError(res, 500, 'Error al registrar el uso de la herramienta.');
    }
};
