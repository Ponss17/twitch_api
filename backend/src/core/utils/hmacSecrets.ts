import { CONFIG } from '../config/env';

/** Secretos HMAC activos (actual + rotación opcional vía PREVIOUS_HMAC_SIGNING_SECRET). */
export function getHmacSecrets(): string[] {
    const current = CONFIG.HMAC_SIGNING_SECRET ?? (CONFIG.TWITCH_CLIENT_SECRET as string);
    const prev = process.env.PREVIOUS_HMAC_SIGNING_SECRET?.trim();
    if (prev && prev !== current && prev.length >= 32) {
        return [current, prev];
    }
    return [current];
}

export function getPrimaryHmacSecret(): string {
    return getHmacSecrets()[0];
}
