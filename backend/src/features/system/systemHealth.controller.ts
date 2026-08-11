import { Response } from 'express';
import * as dbService from '../../core/database/dbService';
import { kv } from '../../core/database/redisClient';
import axios from 'axios';
import { logger } from '../../core/utils/logger';
import { APP_VERSION } from '../../core/config/appVersion';

import { AuthenticatedRequest } from '../../types/twitch';

interface HealthCacheEntry {
    httpStatus: number;
    data: Record<string, unknown>;
}
let cachedHealthResult: HealthCacheEntry | null = null;
let healthCacheExpiry = 0;

export const getHealth = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.query.probe === 'live') {
            return res.status(200).json({
                status: 'alive',
                probe: 'liveness',
                timestamp: new Date().toISOString(),
                version: APP_VERSION
            });
        }

        const now = Date.now();
        // 1. Cache en memoria (warm start): respuesta instantánea
        if (cachedHealthResult && healthCacheExpiry > now) {
            return res.status(cachedHealthResult.httpStatus).json(cachedHealthResult.data);
        }

        // Ejecutamos TODAS las comprobaciones en paralelo para reducir latencia drásticamente
        const [dbResult, redisResult, twitchResult] = await Promise.all([
            // 1. DB Check
            (async () => {
                const start = Date.now();
                try {
                    const { error } = await dbService.supabase
                        .from('users')
                        .select('user_id')
                        .limit(1);
                    return { status: error ? 'offline' : 'online', latency: Date.now() - start };
                } catch {
                    return { status: 'offline', latency: Date.now() - start };
                }
            })(),
            // 2. Redis Check
            (async () => {
                const start = Date.now();
                try {
                    await kv.ping();
                    return { status: 'online', latency: Date.now() - start };
                } catch {
                    return { status: 'offline', latency: Date.now() - start };
                }
            })(),
            // 3. Twitch Check (Rápido, sin validar token para no consumir cuota/CPU)
            (async () => {
                const start = Date.now();
                try {
                    await axios.get('https://id.twitch.tv', { timeout: 2000 });
                    return { status: 'online', latency: Date.now() - start };
                } catch {
                    return { status: 'offline', latency: Date.now() - start };
                }
            })()
        ]);

        const dbStatus = dbResult.status as 'online' | 'offline';
        const redisStatus = redisResult.status as 'online' | 'offline';
        const twitchStatus = twitchResult.status as 'online' | 'offline';

        const isOperational = dbStatus === 'online' && redisStatus === 'online';

        // --- 4. Métricas de Sistema ---
        const memoryUsage = process.memoryUsage();

        const httpStatus = isOperational ? 200 : 503;
        const responseData = {
            status: isOperational ? 'operational' : dbStatus === 'online' ? 'degraded' : 'down',
            probe: 'readiness',
            timestamp: new Date().toISOString(),
            version: APP_VERSION,
            uptime: `${Math.floor(process.uptime())}s`,
            services: {
                database: {
                    status: dbStatus,
                    latency: `${dbResult.latency}ms`,
                    provider: 'Supabase'
                },
                cache: {
                    status: redisStatus,
                    latency: `${redisResult.latency}ms`,
                    provider: 'Vercel KV'
                },
                twitch: {
                    status: twitchStatus,
                    latency: `${twitchResult.latency}ms`
                }
            },
            system: {
                memory: {
                    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
                }
            }
        };

        // Caché breve: evita amplificar probes sin ocultar recuperaciones durante un minuto.
        cachedHealthResult = { httpStatus, data: responseData };
        healthCacheExpiry = now + 10_000;

        res.status(httpStatus).json(responseData);
    } catch (e) {
        logger.error('Error in health check:', e);
        res.status(500).json({
            status: 'error',
            message: 'Internal health check failure'
        });
    }
};
