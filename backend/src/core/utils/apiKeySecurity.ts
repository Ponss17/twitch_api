import crypto from 'crypto';
import { decrypt, encrypt, isCbcFormat, isGcmFormat } from '../database/cryptoService';
import { getHmacSecrets, getPrimaryHmacSecret } from './hmacSecrets';

export function normalizeApiKey(apiKey: string): string {
    const normalized = apiKey.trim().toLowerCase();
    const compact = normalized.replace(/-/g, '');
    return compact.length === 32
        ? `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`
        : normalized;
}

/**
 * HMAC-SHA256 keyed fingerprint for high-entropy API keys (lookup / cache keys).
 * Not password storage — Argon2/bcrypt would break O(1) keyed lookup.
 * CodeQL js/insufficient-password-hash is a false positive here.
 */
function hmacSha256Hex(secret: string, message: string): string {
    return (
        /* codeql[js/insufficient-password-hash] keyed API-key fingerprint, not password storage */
        crypto.createHmac('sha256', secret).update(message, 'utf8').digest('hex')
    );
}

/** Huellas HMAC (secreto actual + PREVIOUS opcional) para lookup sin romper rotación. */
export function apiKeyLookupHashes(apiKey: string): string[] {
    const normalized = normalizeApiKey(apiKey);
    const seen = new Set<string>();
    const hashes: string[] = [];
    for (const secret of getHmacSecrets()) {
        const hash = hmacSha256Hex(secret, normalized);
        if (seen.has(hash)) continue;
        seen.add(hash);
        hashes.push(hash);
    }
    return hashes;
}

export function apiKeyLookupHash(apiKey: string): string {
    return hmacSha256Hex(getPrimaryHmacSecret(), normalizeApiKey(apiKey));
}

export function encryptApiKey(apiKey: string): string {
    return isGcmFormat(apiKey) || isCbcFormat(apiKey) ? apiKey : encrypt(normalizeApiKey(apiKey));
}

export function decryptStoredApiKey(stored: string): {
    plaintext: string;
    legacy: boolean;
} {
    if (isGcmFormat(stored) || isCbcFormat(stored)) {
        return { plaintext: decrypt(stored), legacy: isCbcFormat(stored) };
    }
    return { plaintext: normalizeApiKey(stored), legacy: true };
}
