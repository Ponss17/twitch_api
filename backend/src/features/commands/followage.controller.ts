import { Response } from 'express';

import * as apiService from '../twitch/twitch.service';
import * as cacheService from '../../core/database/cacheService';
import { ownerScopedCacheKey, resolveCache } from '../../core/config/cacheTtl';

import { logger } from '../../core/utils/logger';
import { AuthenticatedRequest } from '../../types/twitch';
import { safeString, sanitizeHtml } from '../../core/utils/validationHelpers';
import { withTwitchAuth } from '../../core/utils/twitchAuthHelpers';
import { trackRequest } from '../../core/utils/tracking';
import { normalizeLanguage, getTimePhraseBetween } from '../../core/utils/time';
import { getFollowageTexts } from '../twitch/twitchUserService';
import { fillTemplate } from './commandTemplates';

function followagePlainText(result: unknown): string {
    if (typeof result === 'string' && result.trim()) return result.trim();
    if (result && typeof result === 'object' && !Array.isArray(result)) {
        const text = (result as { text?: unknown }).text;
        if (typeof text === 'string' && text.trim()) return text.trim();
    }
    return 'No se pudo obtener el followage. Intenta de nuevo en unos segundos.';
}

function applyFollowageTemplate(
    templateRaw: string,
    timePhrase: string,
    user: string,
    channel: string
): string {
    return fillTemplate(templateRaw, { time: timePhrase, user, channel });
}

export const followage = async (req: AuthenticatedRequest, res: Response) => {
    const channel = safeString(req.query.channel);
    const user = safeString(req.query.user);
    const userId = req.userId;
    const rawLang = safeString(req.query.lang);
    const lang = normalizeLanguage(rawLang);
    const texts = getFollowageTexts(lang);

    let sanitizedUser = user;
    if (sanitizedUser?.includes('$(') || sanitizedUser?.includes('${')) sanitizedUser = 'Anónimo';

    const result = await trackRequest(
        userId,
        {
            type: 'followage',
            user: sanitizedUser,
            metadata: { target: channel },
            incrementStat: 'followage'
        },
        async () => {
            // Helix: broadcaster o moderador del canal (scope moderator:read:followers).
            const cacheKey = ownerScopedCacheKey(
                userId,
                `cache:cmd:followage:v7:channel:${channel}:user:${user}:lang:${lang}`
            );
            const cached = await cacheService.get<{ text: string; timePhrase: string; followDateMs?: number }>(cacheKey);

            if (cached && typeof cached === 'object' && !Array.isArray(cached)) {
                const entry = { ...cached };
                if (entry.followDateMs) {
                    const newTimePhrase = getTimePhraseBetween(new Date(entry.followDateMs), new Date(), lang);
                    entry.timePhrase = newTimePhrase;
                    entry.text = texts.following(user, channel, newTimePhrase);
                }
                const template = safeString(req.query.template);
                if (template && entry.timePhrase && entry.timePhrase !== 'error') {
                    return applyFollowageTemplate(template, entry.timePhrase, user, channel);
                }
                if (typeof entry.text === 'string' && entry.text.trim() && entry.timePhrase !== 'error') {
                    return entry.text;
                }
            }

            const apiResult = await withTwitchAuth(
                req,
                res,
                async (token: string) => apiService.getFollowAge(channel, user, token, lang),
                'FOLLOWAGE'
            );

            if (!apiResult || typeof apiResult.text !== 'string' || !apiResult.text.trim()) {
                logger.error('Followage sin texto usable', {
                    channel,
                    user,
                    hasToken: Boolean(req.twitchToken),
                    apiResult
                });
                return 'No se pudo obtener el followage. Vuelve a iniciar sesión en el panel e intenta de nuevo.';
            }

            // Solo cachear follows reales (con fecha). "no sigue" / errores no se cachean.
            if (apiResult.timePhrase !== 'error' && apiResult.timePhrase !== texts.notFollowingTime) {
                const ttl = resolveCache(
                    'COMMAND',
                    res.locals?.apiUser?.role,
                    res.locals?.apiUser?.customCacheTtl
                );
                await cacheService.set(cacheKey, apiResult, ttl);
            }

            const rawTemplate = safeString(req.query.template);
            if (rawTemplate && apiResult.timePhrase && apiResult.timePhrase !== 'error') {
                return applyFollowageTemplate(
                    rawTemplate,
                    sanitizeHtml(apiResult.timePhrase),
                    sanitizeHtml(user),
                    sanitizeHtml(channel)
                );
            }
            return apiResult.text.trim();
        },
        req
    );

    const body =
        typeof result === 'string' && result.trim()
            ? result.trim()
            : followagePlainText(result);
    logger.debug('Followage respuesta', {
        channel,
        user,
        bodyPreview: body.slice(0, 180)
    });
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    // Respuesta personalizada (apiKey): nunca cachear en CDN.
    res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    return res.send(body);
};
