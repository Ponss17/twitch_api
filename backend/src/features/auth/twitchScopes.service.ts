import { get as cacheGet, set as cacheSet, del as cacheDel, isKvWriteAvailable } from '../../core/database/cacheService';
import * as dbService from '../../core/database/dbService';
import * as authService from '../auth/auth.service';
import * as apiService from '../twitch/twitch.service';

const SCOPES_TTL_SEC = 30 * 60;

function scopesCacheKey(userId: string): string {
    return `twitch:scopes:${userId}`;
}

export async function rememberTwitchScopes(userId: string, scopes: string[]): Promise<void> {
    if (!userId || !scopes.length || !isKvWriteAvailable()) return;
    await cacheSet(scopesCacheKey(userId), scopes, SCOPES_TTL_SEC);
}

export async function clearTwitchScopesCache(userId: string): Promise<void> {
    if (!userId) return;
    await cacheDel(scopesCacheKey(userId));
}

export async function resolveTwitchScopes(
    userId: string,
    token?: string | null
): Promise<string[] | undefined> {
    if (!userId) return undefined;

    const cached = await cacheGet<string[]>(scopesCacheKey(userId));
    if (Array.isArray(cached) && cached.length > 0) return cached;

    let accessToken = token || undefined;
    if (!accessToken) {
        try {
            const user = await dbService.getUser(userId);
            if (!user) return undefined;
            accessToken = (await authService.getValidTokenForUser(user)).accessToken;
        } catch {
            return undefined;
        }
    }

    try {
        const validation = await apiService.validateToken(accessToken);
        const scopes = validation?.scopes;
        if (!Array.isArray(scopes) || scopes.length === 0) return undefined;
        await rememberTwitchScopes(userId, scopes);
        return scopes;
    } catch {
        return undefined;
    }
}
