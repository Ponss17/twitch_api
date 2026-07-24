import { Response } from 'express';
import { supabase } from '../../core/database/supabaseClient';
import * as cacheService from '../../core/database/cacheService';
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

    const range = (req.query.range as string) || 'today';
    const limit = Math.min(Number(req.query.limit) || 10, 25);

    try {
        const cacheKey = `cache:leaderboard:${userId}:${range}:${limit}`;
        const cached = await cacheService.get<ViewerLeaderboardEntry[]>(cacheKey);
        if (cached) return res.json(cached);

        // Calcular la fecha de inicio según el rango
        const now = new Date();
        let fromDate: string;

        if (range === 'today') {
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);
            fromDate = startOfDay.toISOString();
        } else {
            // 7 días
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            fromDate = sevenDaysAgo.toISOString();
        }

        // Query agrupada: cuenta cuántas veces aparece cada viewer
        const { data, error } = await supabase
            .from('activity_logs')
            .select('user_name, created_at')
            .eq('user_id', userId)
            .gte('created_at', fromDate)
            .not('user_name', 'in', '("Anónimo","Streamer","Canal")')
            .order('created_at', { ascending: false });

        if (error) {
            logger.error('Error obteniendo leaderboard de viewers:', error.message);
            return jsonError(res, 500, 'Error al obtener el leaderboard de viewers.');
        }

        // Agrupar por user_name en memoria (Supabase no expone GROUP BY directamente en el SDK)
        const countMap = new Map<string, { total: number; last_seen: string }>();
        for (const row of data ?? []) {
            const name = row.user_name as string;
            if (!name || name.length < 1) continue;

            const existing = countMap.get(name);
            if (existing) {
                existing.total += 1;
                // Ya están ordenados por desc, el primero que encontramos es el más reciente
            } else {
                countMap.set(name, { total: 1, last_seen: row.created_at as string });
            }
        }

        const leaderboard: ViewerLeaderboardEntry[] = Array.from(countMap.entries())
            .map(([user_name, { total, last_seen }]) => ({ user_name, total, last_seen }))
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);

        const ttl = resolveCache('ACTIVITY_FEED', res.locals?.apiUser?.role, res.locals?.apiUser?.customCacheTtl);
        await cacheService.set(cacheKey, leaderboard, ttl);

        return res.json(leaderboard);
    } catch (e) {
        logger.error('Error fatal en getViewerLeaderboard:', e);
        return jsonError(res, 500, 'Error interno al obtener el leaderboard.');
    }
};
