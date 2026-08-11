import { createHash } from 'crypto';

/** Namespace fijo (URL) para UUID v5 de sujetos Realtime. */
const REALTIME_SUB_NAMESPACE = Buffer.from('6ba7b8109dad11d180b400c04fd430c8', 'hex');

/**
 * UUID v5 estable a partir del Twitch user id.
 * Supabase Realtime exige que `auth.uid()` / `sub` sea UUID; el id de Twitch
 * vive en el claim `user_id` (texto) para las políticas RLS.
 */
export function realtimeSubjectUuid(twitchUserId: string): string {
    const hash = createHash('sha1')
        .update(REALTIME_SUB_NAMESPACE)
        .update(`twitch:${twitchUserId}`)
        .digest();

    hash[6] = (hash[6]! & 0x0f) | 0x50;
    hash[8] = (hash[8]! & 0x3f) | 0x80;

    const hex = hash.subarray(0, 16).toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
