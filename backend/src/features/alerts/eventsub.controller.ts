import type { Request, Response } from 'express';
import { del as cacheDel, setIfAbsent } from '../../core/database/cacheService';
import { logger } from '../../core/utils/logger';
import { isEventSubTimestampFresh, verifyEventSubSignature } from './bitsRoulette.logic';
import {
    eventSubSecret,
    handleCheerNotification
} from './bitsRoulette.service';
import { revokeBitsAlertSubscription } from './bitsRoulette.store';

type TwitchHeaders = {
    id?: string;
    timestamp?: string;
    signature?: string;
    messageType?: string;
    subscriptionType?: string;
};

function readTwitchHeaders(req: Request): TwitchHeaders {
    return {
        id: req.header('Twitch-Eventsub-Message-Id') || undefined,
        timestamp: req.header('Twitch-Eventsub-Message-Timestamp') || undefined,
        signature: req.header('Twitch-Eventsub-Message-Signature') || undefined,
        messageType: req.header('Twitch-Eventsub-Message-Type') || undefined,
        subscriptionType: req.header('Twitch-Eventsub-Subscription-Type') || undefined
    };
}

function getRawBody(req: Request): Buffer {
    const anyReq = req as Request & { rawBody?: Buffer };
    if (Buffer.isBuffer(anyReq.rawBody)) return anyReq.rawBody;
    if (Buffer.isBuffer(req.body)) return req.body;
    return Buffer.from(JSON.stringify(req.body ?? {}), 'utf8');
}

/** Más largo que la ventana de 10 min, para que un replay no entre al caducar el dedup. */
const DEDUP_TTL_SEC = 60 * 60;

const devSeen = new Map<string, number>();

function devClaim(messageId: string): boolean {
    const now = Date.now();
    for (const [id, exp] of devSeen) {
        if (exp <= now) devSeen.delete(id);
    }
    const exp = devSeen.get(messageId);
    if (exp && exp > now) return false;
    devSeen.set(messageId, now + DEDUP_TTL_SEC * 1000);
    return true;
}

function dedupKey(messageId: string): string {
    return `eventsub:msg:${messageId}`;
}

export async function twitchEventSubWebhook(req: Request, res: Response) {
    const headers = readTwitchHeaders(req);
    const raw = getRawBody(req);
    const secret = eventSubSecret();

    if (
        !headers.id ||
        !headers.timestamp ||
        !isEventSubTimestampFresh(headers.timestamp) ||
        !verifyEventSubSignature(secret, headers.id, headers.timestamp, raw, headers.signature)
    ) {
        return res.status(403).send('Invalid signature');
    }

    let body: Record<string, unknown>;
    try {
        body = JSON.parse(raw.toString('utf8')) as Record<string, unknown>;
    } catch {
        return res.status(400).send('Bad JSON');
    }

    if (headers.messageType === 'webhook_callback_verification') {
        const challenge = typeof body.challenge === 'string' ? body.challenge : '';
        return res.status(200).type('text/plain').send(challenge);
    }

    if (headers.messageType === 'revocation') {
        const sub = body.subscription as
            | { type?: string; condition?: { broadcaster_user_id?: string } }
            | undefined;
        const broadcasterUserId = sub?.condition?.broadcaster_user_id || '';
        logger.warn('EventSub revocation', { type: sub?.type, broadcasterUserId });
        if (broadcasterUserId) {
            try {
                await revokeBitsAlertSubscription(broadcasterUserId);
            } catch (err) {
                logger.error('EventSub revocation persist', err);
                return res.status(500).end();
            }
        }
        return res.status(204).end();
    }

    if (headers.messageType !== 'notification') {
        return res.status(204).end();
    }

    const claim = await setIfAbsent(dedupKey(headers.id), '1', DEDUP_TTL_SEC);
    if (claim === 'exists') return res.status(204).end();
    if (claim === 'unavailable') {
        if (process.env.NODE_ENV === 'production') return res.status(503).end();
        if (!devClaim(headers.id)) return res.status(204).end();
    }

    const subType =
        headers.subscriptionType ||
        (body.subscription as { type?: string } | undefined)?.type ||
        '';

    if (subType === 'channel.cheer') {
        const event = (body.event || {}) as {
            bits?: number;
            broadcaster_user_id?: string;
            user_name?: string;
            user_login?: string;
        };
        const bits = Number(event.bits) || 0;
        const broadcasterUserId = String(event.broadcaster_user_id || '');
        if (broadcasterUserId && bits > 0) {
            try {
                await handleCheerNotification({
                    messageId: headers.id,
                    broadcasterUserId,
                    bits,
                    userName: event.user_name || event.user_login
                });
            } catch (err) {
                logger.error('channel.cheer handler', err);
                await cacheDel(dedupKey(headers.id));
                devSeen.delete(headers.id);
                return res.status(500).end();
            }
        }
    }

    return res.status(204).end();
}
