import crypto from 'crypto';
import { CONFIG } from '../config/env';

const GCM_PREFIX = 'gcm';
const CBC_ALGORITHM = 'aes-256-cbc';
const GCM_ALGORITHM = 'aes-256-gcm';
const GCM_IV_LENGTH = 12;

const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(CONFIG.ENCRYPTION_KEY)).digest();
const LEGACY_ENCRYPTION_KEY = crypto
    .createHash('sha256')
    .update(String(CONFIG.TWITCH_CLIENT_SECRET))
    .digest();

function encryptGcm(text: string, key: Buffer): string {
    const iv = crypto.randomBytes(GCM_IV_LENGTH);
    const cipher = crypto.createCipheriv(GCM_ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${GCM_PREFIX}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptGcm(text: string, key: Buffer): string {
    const parts = text.split(':');
    if (parts.length !== 4 || parts[0] !== GCM_PREFIX) {
        throw new Error('Formato GCM inválido');
    }
    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encrypted = Buffer.from(parts[3], 'hex');
    const decipher = crypto.createDecipheriv(GCM_ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

function decryptCbc(text: string, key: Buffer): string {
    const textParts = text.split(':');
    if (textParts.length < 2) return text;
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(CBC_ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

/** Cifra con AES-256-GCM (autenticado). Nuevos tokens OAuth usan este formato. */
export function encrypt(text: string): string {
    if (!text) return text;
    return encryptGcm(text, ENCRYPTION_KEY);
}

/** Descifra GCM (nuevo), CBC (ENCRYPTION_KEY) o CBC legacy (TWITCH_CLIENT_SECRET). */
export function decrypt(text: string, key: Buffer = ENCRYPTION_KEY): string {
    if (!text) return text;
    if (text.startsWith(`${GCM_PREFIX}:`)) {
        return decryptGcm(text, key);
    }
    return decryptCbc(text, key);
}

export { ENCRYPTION_KEY, LEGACY_ENCRYPTION_KEY };
