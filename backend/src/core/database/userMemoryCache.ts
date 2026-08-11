import { StoredUser } from '../../types/twitch';
import { BoundedMap } from '../utils/boundedCache';
import { CACHE_TTL_MATRIX } from '../config/cacheTtl';
import { setUserTimezone, clearUserTimezone } from './userTimezoneCache';

/** L1 en RAM de la instancia serverless — evita round-trips a KV/Supabase en bots activos. */
export const userMemoryCache = new BoundedMap<string, { user: StoredUser; expiry: number }>(1000);
export const pendingGetUser = new Map<string, Promise<StoredUser | null>>();

export const invalidateUserMemoryCache = (userId: string): void => {
    userMemoryCache.delete(userId);
    pendingGetUser.delete(userId);
    clearUserTimezone(userId);
};

export function rememberUserCaches(user: StoredUser): void {
    setUserTimezone(user.userId, user.timezone);
    userMemoryCache.set(user.userId, {
        user,
        expiry: Date.now() + CACHE_TTL_MATRIX.API_USER.default * 1000
    });
}
