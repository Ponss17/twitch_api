import { Response } from 'express';

import * as cacheService from '../../core/database/cacheService';
import { ownerScopedCacheKey, resolveCache } from '../../core/config/cacheTtl';

import { AuthenticatedRequest } from '../../types/twitch';
import { safeString, sanitizeHtml, toSafePathIdentifier } from '../../core/utils/validationHelpers';
import { trackRequest } from '../../core/utils/tracking';
import { normalizeLanguage, formatDuration } from '../../core/utils/time';
import { getStreamElementsWatchtime } from '../integrations/streamelements.service';
import { fillTemplate } from './commandTemplates';

// --- Textos para watchtime (vía StreamElements) ---
function getWatchtimeTexts(lang: string = 'es') {
    const l = (lang || 'es').toLowerCase().trim();
    if (l.startsWith('en')) {
        return {
            notWatching: (u: string, ch: string) => `${u} has no watchtime registered in ${ch}.`,
            watching: (u: string, ch: string, time: string) => `${u} has been watching ${ch} for ${time}.`
        };
    }
    if (l.startsWith('pt')) {
        return {
            notWatching: (u: string, ch: string) => `${u} não tem watchtime registrado em ${ch}.`,
            watching: (u: string, ch: string, time: string) => `${u} assiste ${ch} há ${time}.`
        };
    }
    return {
        notWatching: (u: string, ch: string) => `${u} no tiene watchtime registrado en ${ch}.`,
        watching: (u: string, ch: string, time: string) => `${u} lleva ${time} viendo a ${ch}.`
    };
}

function applyWatchtimeTemplate(templateRaw: string, timePhrase: string, user: string, channel: string): string {
    return fillTemplate(templateRaw, { time: timePhrase, user, channel });
}

export const watchtime = async (req: AuthenticatedRequest, res: Response) => {
    const channel = toSafePathIdentifier(req.query.channel);
    const user = toSafePathIdentifier(req.query.user);
    const userId = req.userId;
    const rawLang = safeString(req.query.lang);
    const lang = normalizeLanguage(rawLang);
    const wtTexts = getWatchtimeTexts(lang);

    if (!channel || !user) {
        return res.status(400).json({ error: 'Parámetros inválidos.' });
    }

    let sanitizedUser = user;
    if (sanitizedUser?.includes('$(') || sanitizedUser?.includes('${')) sanitizedUser = 'Anónimo';

    const result = await trackRequest(
        userId,
        {
            type: 'watchtime',
            user: sanitizedUser,
            metadata: { target: channel },
            incrementStat: 'watchtime'
        },
        async () => {
            const cacheKey = ownerScopedCacheKey(
                userId,
                `cache:cmd:watchtime:v2:channel:${channel}:user:${user}:lang:${lang}`
            );
            const cached = await cacheService.get<{ text: string; timePhrase: string }>(cacheKey);

            if (cached && typeof cached === 'object' && !Array.isArray(cached)) {
                const entry = { ...cached };
                const template = safeString(req.query.template);
                if (template && entry.timePhrase && entry.timePhrase !== 'error') {
                    return applyWatchtimeTemplate(template, entry.timePhrase, user, channel);
                }
                if (typeof entry.text === 'string' && entry.text.trim() && entry.timePhrase !== 'error') {
                    return entry.text;
                }
            }

            // Llamamos a StreamElements para obtener el watchtime real en minutos
            const apiResult = await getStreamElementsWatchtime(channel, user);

            let watchtimeText: string;
            let timePhrase = 'error';

            if (apiResult.error === 'not_found' || apiResult.error === 'api_error') {
                timePhrase = 'error';
                watchtimeText = lang === 'es' ? 'El sistema de puntos/watchtime de StreamElements no está activado en este canal o es privado.' :
                                lang === 'en' ? 'StreamElements points/watchtime system is not enabled or is private in this channel.' :
                                'O sistema de pontos/watchtime do StreamElements não está ativado neste canal ou é privado.';
            } else if (apiResult.error === 'not_watching' || apiResult.minutes === 0) {
                timePhrase = 'sin-watchtime';
                watchtimeText = wtTexts.notWatching(user, channel);
            } else {
                // Convertir minutos a milisegundos para nuestro formateador
                const ms = apiResult.minutes * 60 * 1000;
                timePhrase = formatDuration(ms, lang);
                watchtimeText = wtTexts.watching(user, channel, timePhrase);
            }

            // Cachear el resultado si no fue un error grave (API down), aunque sea 0 minutos se cachea un rato
            if (timePhrase !== 'error') {
                const ttl = resolveCache(
                    'COMMAND',
                    res.locals?.apiUser?.role,
                    res.locals?.apiUser?.customCacheTtl
                );
                await cacheService.set(cacheKey, { text: watchtimeText, timePhrase }, ttl);
            }

            // Aplicar plantilla personalizada si se proporcionó en la URL
            const rawTemplate = safeString(req.query.template);
            if (rawTemplate && timePhrase && timePhrase !== 'error' && timePhrase !== 'sin-watchtime') {
                return applyWatchtimeTemplate(
                    rawTemplate,
                    sanitizeHtml(timePhrase),
                    sanitizeHtml(user),
                    sanitizeHtml(channel)
                );
            }

            return watchtimeText;
        },
        req
    );

    const body = typeof result === 'string' && result.trim()
        ? result.trim()
        : 'No se pudo obtener el watchtime. Intenta de nuevo en unos segundos.';

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    return res.send(body);
};
