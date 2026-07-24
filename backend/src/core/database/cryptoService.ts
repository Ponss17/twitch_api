import crypto from 'crypto';
import { CONFIG } from '../config/env';

const GCM_PREFIX = 'gcm';
const GCM_ALGORITHM = 'aes-256-gcm';
const GCM_IV_LENGTH = 12;
const CBC_ALGORITHM = 'aes-256-cbc';

export const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(CONFIG.ENCRYPTION_KEY)).digest();
/** Retrocompatibilidad con tokens cifrados antes del cambio de ENCRYPTION_KEY. */
export const LEGACY_ENCRYPTION_KEY = crypto
    .createHash('sha256')
    .update(String(CONFIG.TWITCH_CLIENT_SECRET))
    .digest();

export function isCbcFormat(text: string): boolean {
    const parts = text.split(':');
    return (
        parts.length === 2 &&
        parts[0].length === 32 &&
        /^[0-9a-f]+$/i.test(parts[0]) &&
        /^[0-9a-f]+$/i.test(parts[1])
    );
}

export function isGcmFormat(text: string): boolean {
    return text.startsWith(`${GCM_PREFIX}:`);
}

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
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(CBC_ALGORITHM, key, iv);
    return Buffer.concat([decipher.update(encryptedText), decipher.final()]).toString('utf8');
}

/** Cifra con AES-256-GCM (autenticado). Nuevos tokens OAuth usan este formato. */
export function encrypt(text: string): string {
    if (!text) return text;
    return encryptGcm(text, ENCRYPTION_KEY);
}

/** Descifra GCM (nuevo) o CBC (legacy). */
export function decrypt(text: string, key: Buffer = ENCRYPTION_KEY): string {
    if (!text) return text;
    if (isGcmFormat(text)) {
        return decryptGcm(text, key);
    }
    if (isCbcFormat(text)) {
        return decryptCbc(text, key);
    }
    // Texto sin formato de cifrado reconocido: lanzar error en lugar de devolver
    // el valor en claro para evitar filtrar datos sin cifrar silenciosamente.
    throw new Error(`Formato de cifrado desconocido para el valor (longitud: ${text.length})`);
}
