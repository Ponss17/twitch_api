import crypto from 'crypto';
import { CONFIG } from '../config/env';
import * as cacheService from '../database/cacheService';
import { logger } from '../utils/logger';
import { getPrimaryHmacSecret } from '../security/hmacSecrets';
import { OVERLAY_TOOLS, overlayRevokeKey } from './keys';

/**
 * Push del estado de overlay por Supabase Realtime (broadcast público).
 * El topic es un HMAC no adivinable que solo se entrega al overlay autenticado (GET),
 * y cambia al revocar overlays (epoch = timestamp de revocación).
 */
export const OVERLAY_REALTIME_EVENT = 'state';

const BROADCAST_TIMEOUT_MS = 1500;
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

async function overlayRevokeEpoch(userId: string): Promise<number> {
    const value = await cacheService.get<number>(overlayRevokeKey(userId));
    return typeof value === 'number' ? value : 0;
}

function topicFor(userId: string, tool: string, epoch: number): string {
    const digest = crypto
        .createHmac('sha256', getPrimaryHmacSecret())
        .update(`overlay-realtime:${userId}:${tool}:${epoch}`)
        .digest('base64url')
        .slice(0, 32);
    return `overlay:${digest}`;
}

export async function overlayRealtimeTopic(userId: string, tool: string): Promise<string> {
    return topicFor(userId, tool, await overlayRevokeEpoch(userId));
}

async function sendBroadcast(
    messages: { topic: string; payload: { state: Record<string, unknown> | null } }[]
): Promise<void> {
    if (isTestEnv || messages.length === 0) return;
    const key = CONFIG.SUPABASE_SERVICE_ROLE_KEY as string;
    try {
        const res = await fetch(`${CONFIG.SUPABASE_URL}/realtime/v1/api/broadcast`, {
            method: 'POST',
            headers: {
                apikey: key,
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: messages.map((m) => ({
                    topic: m.topic,
                    event: OVERLAY_REALTIME_EVENT,
                    payload: m.payload,
                    private: false
                }))
            }),
            signal: AbortSignal.timeout(BROADCAST_TIMEOUT_MS)
        });
        if (!res.ok) {
            logger.warn('overlay realtime: broadcast rechazado', { status: res.status });
        }
    } catch (e) {
        logger.warn('overlay realtime: broadcast falló', e);
    }
}

/** Nunca lanza: si Realtime falla, el overlay sigue con polling de respaldo. */
export async function broadcastOverlayState(
    userId: string,
    tool: string,
    state: Record<string, unknown> | null
): Promise<void> {
    try {
        const topic = await overlayRealtimeTopic(userId, tool);
        await sendBroadcast([{ topic, payload: { state } }]);
    } catch (e) {
        logger.warn('overlay realtime: no se pudo preparar el broadcast', e);
    }
}

/** Vacía los overlays abiertos antes de revocar (el topic deja de ser válido después). */
export async function broadcastOverlayReset(userId: string): Promise<void> {
    try {
        const epoch = await overlayRevokeEpoch(userId);
        await sendBroadcast(
            OVERLAY_TOOLS.map((tool) => ({
                topic: topicFor(userId, tool, epoch),
                payload: { state: null }
            }))
        );
    } catch (e) {
        logger.warn('overlay realtime: no se pudo resetear', e);
    }
}
