import crypto from 'crypto';
import { decrypt, encrypt, isCbcFormat, isGcmFormat } from '../database/cryptoService';
import { getPrimaryHmacSecret } from './hmacSecrets';

export function normalizeApiKey(apiKey: string): string {
    const normalized = apiKey.trim().toLowerCase();
    const compact = normalized.replace(/-/g, '');
    return compact.length === 32
        ? `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`
        : normalized;
}

export function apiKeyLookupHash(apiKey: string): string {
    // codeql[js/insufficient-password-hash] Huella HMAC de API key (alta entropía), no hash de password
    return crypto
        .createHmac('sha256', getPrimaryHmacSecret())
        .update(normalizeApiKey(apiKey))
        .digest('hex');
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
