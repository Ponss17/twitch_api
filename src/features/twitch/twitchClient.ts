import axios from 'axios';
import axiosRetry from 'axios-retry';
import https from 'https';
import { kv } from '@vercel/kv';
import { CONFIG } from '../../core/config/env';
import { logger } from '../../core/utils/logger';
import { TwitchApiError } from '../../core/errors/AppError';

const CB_KV_KEY = 'circuit_breaker:twitch';
const CB_KV_TTL_S = 120;

const httpsAgent = new https.Agent({ keepAlive: true });
export const apiClient = axios.create({
    httpsAgent,
    timeout: 10000
});

export const CIRCUIT_BREAKER = {
    failures: 0,
    lastFailure: 0,
    threshold: 5,
    cooldownMs: 30000,
    state: 'CLOSED' as 'CLOSED' | 'OPEN' | 'HALF_OPEN'
};

type CbState = { state: 'OPEN'; lastFailure: number } | { state: 'CLOSED' };

const syncCbToKv = (state: CbState): void => {
    if (state.state === 'OPEN') {
        kv.set(CB_KV_KEY, state, { ex: CB_KV_TTL_S }).catch((e) =>
            logger.error('Cache KV error syncing CB state OPEN:', e)
        );
    } else {
        kv.del(CB_KV_KEY).catch((e) => logger.error('Cache KV error syncing CB state CLOSED:', e));
    }
};

// Al arrancar (cold start), sincronizar con KV sin bloquear
kv.get<CbState>(CB_KV_KEY)
    .then((stored) => {
        if (stored?.state === 'OPEN') {
            CIRCUIT_BREAKER.state = 'OPEN';
            CIRCUIT_BREAKER.lastFailure = stored.lastFailure;
            CIRCUIT_BREAKER.failures = CIRCUIT_BREAKER.threshold;
            logger.warn('[CircuitBreaker] Reanudado desde KV: estado OPEN');
        }
    })
    .catch((e) => logger.error('Cache KV error during CB cold start:', e));

export const checkCircuit = () => {
    if (CIRCUIT_BREAKER.state === 'OPEN') {
        const now = Date.now();
        if (now - CIRCUIT_BREAKER.lastFailure > CIRCUIT_BREAKER.cooldownMs) {
            CIRCUIT_BREAKER.state = 'HALF_OPEN';
            return;
        }
        throw new TwitchApiError(
            'Servicio de Twitch temporalmente inhabilitado (Circuit Breaker)',
            503
        );
    }
};

export const recordFailure = () => {
    CIRCUIT_BREAKER.failures++;
    CIRCUIT_BREAKER.lastFailure = Date.now();
    if (CIRCUIT_BREAKER.failures >= CIRCUIT_BREAKER.threshold) {
        CIRCUIT_BREAKER.state = 'OPEN';
        logger.error('🚨 CIRCUIT BREAKER OPEN: Twitch API is failing consistently.');
        syncCbToKv({ state: 'OPEN', lastFailure: CIRCUIT_BREAKER.lastFailure });

        if (CONFIG.DISCORD_HEALTH_WEBHOOK_URL) {
            axios
                .post(CONFIG.DISCORD_HEALTH_WEBHOOK_URL, {
                    content:
                        '🚨 **CIRCUIT BREAKER ABIERTO** — La API de Twitch está fallando consecutivamente. Todas las peticiones serán bloqueadas por 30 segundos.'
                })
                .catch(() => {});
        }
    }
};

export const recordSuccess = () => {
    if (CIRCUIT_BREAKER.state !== 'CLOSED') {
        CIRCUIT_BREAKER.state = 'CLOSED';
        syncCbToKv({ state: 'CLOSED' });
    }
    CIRCUIT_BREAKER.failures = 0;
};

axiosRetry(apiClient, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
        if (axiosRetry.isNetworkError(error)) {
            logger.warn('Network error detected, retrying...', { error: error.message });
            return true;
        }

        if (axiosRetry.isRetryableError(error)) {
            logger.warn('Retryable error detected, retrying...', {
                status: error.response?.status
            });
            return true;
        }
        if (error.response?.status === 429) {
            logger.warn('Rate limit hit, retrying with backoff...');
            return true;
        }

        return false;
    },
    onRetry: (retryCount, error, requestConfig) => {
        logger.info(`Retry attempt ${retryCount}`, {
            url: requestConfig.url,
            method: requestConfig.method,
            error: error.message
        });
    }
});

export const getHeaders = (token: string) => ({
    'Client-ID': CONFIG.TWITCH_CLIENT_ID,
    Authorization: `Bearer ${token}`
});

export const handleTwitchError = (error: unknown, context: string): never => {
    logger.error(`Error in ${context}:`, error);

    recordFailure();

    if (axios.isAxiosError(error)) {
        throw new TwitchApiError(
            error.response?.data?.message || error.message || 'Error en la API de Twitch',
            error.response?.status || 500
        );
    }
    throw new TwitchApiError('Error interno desconocido', 500);
};
