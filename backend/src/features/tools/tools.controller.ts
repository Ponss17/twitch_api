import { safeString } from '../../core/utils/validationHelpers';
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
import { AppError } from '../../core/errors/AppError';

export const getClips = async (req: AuthenticatedRequest, res: Response) => {
    const channel = safeString(req.query.channel);
    const limitNum = parseInt(safeString(req.query.limit), 10) || 20;
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

/** URL temporal oficial (Helix clips/downloads) para descargar el MP4 del clip. */
export const getClipDownload = async (req: AuthenticatedRequest, res: Response) => {
    const channel = safeString(req.query.channel);
    const clipId = safeString(req.query.clip_id);
    const userId = req.userId;

    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    const result = await trackRequest(
        userId,
        {
            type: 'other',
            user: channel,
            metadata: { action: 'Clip Download', clipId },
            skipActivityLog: true,
            skipRequestCount: true
        },
        async () => {
            try {
                return await withTwitchAuth(
                    req,
                    res,
                    (token) => {
                        const sameChannel =
                            Boolean(req.login) &&
                            channel.toLowerCase() === String(req.login).toLowerCase();
                        return apiService.getClipDownloadUrls(
                            channel,
                            userId,
                            clipId,
                            token,
                            sameChannel ? userId : undefined
                        );
                    },
                    'getClipDownload'
                );
            } catch (error: unknown) {
                const status =
                    error instanceof AppError
                        ? error.statusCode
                        : (error as { statusCode?: number })?.statusCode;
                // Sin scope channel:manage:clips → pedir re-login (403, no cierra sesión en el panel).
                if (status === 401 || status === 403) {
                    throw new AppError(
                        'Necesitas volver a iniciar sesión en Twitch para descargar clips (permiso nuevo).',
                        403
                    );
                }
                throw error;
            }
        },
        req
    );

    if (result) return res.json(result);
    if (!res.headersSent) {
        return jsonError(res, 404, 'No se pudo obtener la descarga de este clip', { code: 'NOT_FOUND' });
    }
};

export const getChatters = async (req: AuthenticatedRequest, res: Response) => {
    const channel = safeString(req.query.channel);
    const eligibilityRaw = safeString(req.query.eligibility);
    const eligibility = apiService.parseEligibilityQuery(eligibilityRaw);
    const userId = req.userId;

    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    const source = safeString(req.query.source);
    const isRoulette = source === 'roulette';
    const annotateExplicit = safeString(req.query.annotate);
    const annotateRoles =
        annotateExplicit === '0' || source === 'stalker'
            ? false
            : annotateExplicit === '1'
              ? true
              : eligibility !== 'all';

    const result = await trackRequest(
        userId,
        { type: 'stalker', user: channel, incrementStat: isRoulette ? undefined : 'stalker', skipActivityLog: isRoulette },
        async () => {
            const cacheKey = ownerScopedCacheKey(
                userId,
                `cache:cmd:getChatters:channel:${channel}:eligibility:${eligibilityRaw ?? 'all'}:annotate:${annotateRoles ? '1' : '0'}`
            );
            const cached = await cacheService.get(cacheKey);
            if (cached) return cached;

            return withTwitchAuth(
                req,
                res,
                async (token) => {
                    const broadcasterId = await apiService.getUserId(channel, token);
                    const chatters = await apiService.getChatters(broadcasterId, userId, token);
                    const payload = annotateRoles
                        ? await apiService.filterAndAnnotateChatters(
                              chatters,
                              broadcasterId,
                              token,
                              eligibility,
                              {
                                  ownerId: userId,
                                  role: res.locals.apiUser?.role,
                                  customTtl: res.locals.apiUser?.customCacheTtl
                              }
                          )
                        : chatters;
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
