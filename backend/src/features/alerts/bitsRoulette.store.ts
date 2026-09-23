import { get as cacheGet, setPersistent } from '../../core/database/cacheService';
import { logger } from '../../core/utils/logger';

/** Solo suscripción EventSub (enable on/off). Umbral y premios van en la URL OBS. */
export interface BitsAlertSubscription {
    userId: string;
    enabled: boolean;
    eventsubId: string | null;
    updatedAt?: string;
}

export function bitsAlertSubKey(userId: string): string {
    return `alerts:bits-sub:${userId}`;
}

export function defaultSubscription(userId: string): BitsAlertSubscription {
    return { userId, enabled: false, eventsubId: null };
}

export async function getBitsAlertSubscription(userId: string): Promise<BitsAlertSubscription> {
    try {
        const raw = await cacheGet(bitsAlertSubKey(userId));
        if (!raw || typeof raw !== 'object') return defaultSubscription(userId);
        const row = raw as Partial<BitsAlertSubscription>;
        return {
            userId,
            enabled: Boolean(row.enabled),
            eventsubId: typeof row.eventsubId === 'string' ? row.eventsubId : null,
            updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : undefined
        };
    } catch (err) {
        logger.error('bits alert sub get:', err);
        return defaultSubscription(userId);
    }
}

export async function saveBitsAlertSubscription(
    userId: string,
    patch: { enabled?: boolean; eventsubId?: string | null }
): Promise<BitsAlertSubscription> {
    const current = await getBitsAlertSubscription(userId);
    const next: BitsAlertSubscription = {
        userId,
        enabled: patch.enabled ?? current.enabled,
        eventsubId: patch.eventsubId !== undefined ? patch.eventsubId : current.eventsubId,
        updatedAt: new Date().toISOString()
    };
    await setPersistent(bitsAlertSubKey(userId), next);
    return next;
}

/** Twitch revocó la suscripción: apagar y olvidar el id para poder crear otra. */
export async function revokeBitsAlertSubscription(userId: string): Promise<void> {
    await saveBitsAlertSubscription(userId, { enabled: false, eventsubId: null });
}
