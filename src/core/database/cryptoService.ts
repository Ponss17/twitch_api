import crypto from 'crypto';
import { CONFIG } from '../config/env';

const ALGORITHM = 'aes-256-cbc';
// Clave derivada de ENCRYPTION_KEY independiente
const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(CONFIG.ENCRYPTION_KEY)).digest();
// Clave legacy (retrocompatibilidad con datos cifrados antes del cambio)
const LEGACY_ENCRYPTION_KEY = crypto
    .createHash('sha256')
    .update(String(CONFIG.TWITCH_CLIENT_SECRET))
    .digest();
const IV_LENGTH = 16;

export function encrypt(text: string): string {
    if (!text) return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string, key: Buffer = ENCRYPTION_KEY): string {
    if (!text) return text;
    const textParts = text.split(':');
    if (textParts.length < 2) return text;
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

export { ENCRYPTION_KEY, LEGACY_ENCRYPTION_KEY };
