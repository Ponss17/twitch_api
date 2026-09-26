import axios from 'axios';
import { kv } from '../../core/database/redisClient';
import {
    isKvWriteAvailable,
    setIfAbsent,
    setStrict,
    get as cacheGet,
    del as cacheDel
} from '../../core/database/cacheService';
import { CONFIG } from '../../core/config/env';
import { CACHE_TTL_MATRIX } from '../../core/config/cacheTtl';
import { logger } from '../../core/utils/logger';
import { overlayStateKey } from '../../core/overlay/keys';
import { apiClient, getHeaders } from '../twitch/twitchClient';
import { sendChatMessage } from '../twitch/twitch.service';
import { bitsWinnerChatMessage } from './bitsRoulette.logic';
import {
    getBitsAlertSubscription,
    saveBitsAlertSubscription
} from './bitsRoulette.store';

const APP_TOKEN_KEY = 'twitch:app_token';
export const BITS_TOOL = 'bits-roulette';

export interface BitsCheerEvent {
    id: string;
    bits: number;
    userName?: string;
    at: number;
}

async function getTwitchAppToken(): Promise<string | null> {
    if (isKvWriteAvailable()) {
        const cached = await kv.get<string>(APP_TOKEN_KEY);
        if (cached) return cached;
    }
    try {
        const tokenRes = await axios.post(
            'https://id.twitch.tv/oauth2/token',
            new URLSearchParams({
                client_id: CONFIG.TWITCH_CLIENT_ID as string,
                client_secret: CONFIG.TWITCH_CLIENT_SECRET as string,
                grant_type: 'client_credentials'
            }).toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        const appToken = tokenRes.data?.access_token as string | undefined;
        if (!appToken) return null;
        if (isKvWriteAvailable()) {
            await kv.set(APP_TOKEN_KEY, appToken, { ex: 24 * 60 * 60 });
        }
        return appToken;
    } catch (err) {
        logger.error('bits roulette: app token', err);
        return null;
    }
}

export function eventSubCallbackUrl(): string {
    const base = String(CONFIG.BASE_URL || '').replace(/\/$/, '');
    return `${base}/webhooks/twitch/eventsub`;
}

/**
 * Secreto del webhook. Nunca el client secret: filtrarlo permitiría crear tokens de app.
 * Twitch exige 10–100 caracteres.
 */
export function eventSubSecret(): string {
    const dedicated = (CONFIG.EVENTSUB_SECRET || '').trim();
    if (dedicated.length >= 10 && dedicated.length <= 100) return dedicated;
    const hmac = (CONFIG.HMAC_SIGNING_SECRET || '').trim();
    if (hmac.length >= 10 && hmac.length <= 100) return hmac;
    // Twitch exige ≤100; HMAC largo se recorta de forma estable para create+verify.
    if (hmac.length > 100) return hmac.slice(0, 100);
    return '';
}

/** Twitch solo acepta callbacks HTTPS públicos — en local no se puede crear la suscripción. */
export function canCreateEventSubWebhook(): boolean {
    try {
        const url = new URL(eventSubCallbackUrl());
        if (url.protocol !== 'https:') return false;
        const host = url.hostname.toLowerCase();
        if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return false;
        return true;
    } catch {
        return false;
    }
}

function twitchErrorDetail(err: unknown): string {
    if (!axios.isAxiosError(err)) return err instanceof Error ? err.message : 'unknown';
    const data = err.response?.data as { message?: string; status?: number } | undefined;
    return data?.message || err.message || `HTTP ${err.response?.status ?? '?'}`;
}

export async function createCheerSubscription(broadcasterUserId: string): Promise<string | null> {
    if (!canCreateEventSubWebhook()) {
        logger.warn('bits roulette: EventSub omitido (callback no público)', {
            callback: eventSubCallbackUrl()
        });
        return null;
    }
    const token = await getTwitchAppToken();
    if (!token) return null;
    const secret = eventSubSecret();
    if (secret.length < 10 || secret.length > 100) {
        logger.error('bits roulette: EVENTSUB_SECRET debe tener 10–100 caracteres');
        return null;
    }
    try {
        const res = await apiClient.post(
            'https://api.twitch.tv/helix/eventsub/subscriptions',
            {
                type: 'channel.cheer',
                version: '1',
                condition: { broadcaster_user_id: broadcasterUserId },
                transport: {
                    method: 'webhook',
                    callback: eventSubCallbackUrl(),
                    secret
                }
            },
            { headers: getHeaders(token) }
        );
        return (res.data?.data?.[0]?.id as string | undefined) ?? null;
    } catch (err) {
        logger.error('bits roulette: create EventSub', twitchErrorDetail(err));
        return null;
    }
}

export async function deleteEventSubSubscription(subscriptionId: string): Promise<void> {
    const token = await getTwitchAppToken();
    if (!token || !subscriptionId) return;
    try {
        await apiClient.delete(
            `https://api.twitch.tv/helix/eventsub/subscriptions?id=${encodeURIComponent(subscriptionId)}`,
            { headers: getHeaders(token) }
        );
    } catch (err) {
        logger.warn('bits roulette: delete EventSub', err);
    }
}

/** Nombre del donador: privado para chat + público en lastCheer (OBS decide si lo muestra). */
export function bitsCheerPrivateKey(userId: string): string {
    return `alerts:bits-cheer:${userId}`;
}

const PRIVATE_CHEER_TTL_SEC = 30 * 60;

/** Publica el cheer (incl. nombre) para el overlay OBS. */
export async function publishCheerEvent(
    userId: string,
    cheer: BitsCheerEvent
): Promise<void> {
    const key = overlayStateKey(userId, BITS_TOOL);
    let prev: Record<string, unknown> = {};
    try {
        const existing = await cacheGet(key);
        if (existing && typeof existing === 'object') prev = existing as Record<string, unknown>;
    } catch {
        /* ignore */
    }
    const publicCheer = {
        id: cheer.id,
        bits: cheer.bits,
        at: cheer.at,
        userName: (cheer.userName || '').trim().slice(0, 25) || undefined
    };
    await setStrict(
        bitsCheerPrivateKey(userId),
        {
            id: cheer.id,
            bits: cheer.bits,
            userName: (cheer.userName || '').slice(0, 25),
            at: cheer.at
        },
        PRIVATE_CHEER_TTL_SEC
    );
    await setStrict(
        key,
        {
            ...prev,
            lastCheer: publicCheer,
            updatedAt: Date.now()
        },
        CACHE_TTL_MATRIX.OVERLAY_STATE.default
    );
}

export async function handleCheerNotification(payload: {
    messageId: string;
    broadcasterUserId: string;
    bits: number;
    userName?: string;
}): Promise<'published' | 'disabled'> {
    const sub = await getBitsAlertSubscription(payload.broadcasterUserId);
    if (!sub.enabled) return 'disabled';
    await publishCheerEvent(payload.broadcasterUserId, {
        id: payload.messageId,
        bits: payload.bits,
        userName: payload.userName,
        at: Date.now()
    });
    return 'published';
}

type SubAlive = 'alive' | 'dead' | 'unknown';

/** No crear otra suscripción si Twitch aún tiene la anterior. */
async function cheerSubscriptionAlive(subscriptionId: string): Promise<SubAlive> {
    const token = await getTwitchAppToken();
    if (!token) return 'unknown';
    try {
        const res = await apiClient.get(
            `https://api.twitch.tv/helix/eventsub/subscriptions?id=${encodeURIComponent(subscriptionId)}`,
            { headers: getHeaders(token) }
        );
        const row = (res.data?.data?.[0] || null) as { status?: string } | null;
        if (!row) return 'dead';
        const status = row.status || '';
        if (status === 'enabled' || status === 'webhook_callback_verification_pending') {
            return 'alive';
        }
        return 'dead';
    } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) return 'dead';
        logger.warn('bits roulette: no se pudo comprobar EventSub', twitchErrorDetail(err));
        return 'unknown';
    }
}

export async function enableBitsAlert(userId: string): Promise<{
    subscription: Awaited<ReturnType<typeof saveBitsAlertSubscription>>;
    localOnly: boolean;
}> {
    const current = await getBitsAlertSubscription(userId);
    if (current.eventsubId) {
        const alive = await cheerSubscriptionAlive(current.eventsubId);
        if (alive !== 'dead') {
            const subscription = await saveBitsAlertSubscription(userId, { enabled: true });
            return { subscription, localOnly: false };
        }
        logger.warn('bits roulette: suscripción EventSub muerta, se crea otra', {
            id: current.eventsubId
        });
    }

    // Local / callback no público: activar para test-spin; EventSub real solo en prod.
    if (!canCreateEventSubWebhook()) {
        const subscription = await saveBitsAlertSubscription(userId, {
            enabled: true,
            eventsubId: null
        });
        return { subscription, localOnly: true };
    }

    const subId = await createCheerSubscription(userId);
    if (!subId) {
        // En desarrollo, no tumbar el toggle si Twitch no puede verificar el callback aún.
        if (CONFIG.NODE_ENV !== 'production') {
            const subscription = await saveBitsAlertSubscription(userId, {
                enabled: true,
                eventsubId: null
            });
            return { subscription, localOnly: true };
        }
        throw new Error('EVENTSUB_CREATE_FAILED');
    }
    const subscription = await saveBitsAlertSubscription(userId, {
        enabled: true,
        eventsubId: subId
    });
    return { subscription, localOnly: false };
}

export async function disableBitsAlert(userId: string) {
    const current = await getBitsAlertSubscription(userId);
    if (current.eventsubId) {
        await deleteEventSubSubscription(current.eventsubId);
    }
    return saveBitsAlertSubscription(userId, { enabled: false, eventsubId: null });
}

/** Test: simula un cheer con N bits (el overlay aplica su URL). */
export async function publishTestCheer(userId: string, bits: number): Promise<void> {
    await publishCheerEvent(userId, {
        id: `test-${Date.now()}`,
        bits,
        userName: 'test',
        at: Date.now()
    });
}

const ANNOUNCE_TTL_SEC = 60 * 60;

export async function announceBitsWinner(input: {
    userId: string;
    token: string;
    cheerId: string;
    prize: string;
    lang?: string;
}): Promise<'sent' | 'duplicate' | 'stale'> {
    const raw = await cacheGet<{
        id?: string;
        bits?: number;
        userName?: string;
        at?: number;
    }>(bitsCheerPrivateKey(input.userId));
    const age = typeof raw?.at === 'number' ? Date.now() - raw.at : Number.POSITIVE_INFINITY;
    if (!raw || raw.id !== input.cheerId || age > PRIVATE_CHEER_TTL_SEC * 1000 || age < -60_000) {
        return 'stale';
    }

    const claimKey = `alerts:bits-announced:${input.userId}:${input.cheerId}`;
    const claim = await setIfAbsent(claimKey, '1', ANNOUNCE_TTL_SEC);
    if (claim === 'exists') return 'duplicate';
    if (claim === 'unavailable' && process.env.NODE_ENV === 'production') {
        throw new Error('KV_UNAVAILABLE');
    }

    const message = bitsWinnerChatMessage(input.lang, raw.userName || '', input.prize, Number(raw.bits));
    if (!message) {
        await cacheDel(claimKey);
        return 'stale';
    }

    try {
        await sendChatMessage(input.userId, input.userId, message, input.token);
        return 'sent';
    } catch (err) {
        await cacheDel(claimKey);
        throw err;
    }
}

export { getBitsAlertSubscription };
