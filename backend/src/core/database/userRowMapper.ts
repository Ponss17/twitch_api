import { StoredUser } from '../../types/twitch';
import { DEFAULT_USER_ROLE, normalizeUserRole } from '../config/userRoles';

export function resolveTokenExpiresAtIso(user: StoredUser): string | null {
    if (user.tokenExpiresAt && user.tokenExpiresAt > 0) {
        return new Date(user.tokenExpiresAt).toISOString();
    }
    if (user.obtainedAt && user.expiresIn) {
        return new Date(user.obtainedAt + user.expiresIn * 1000).toISOString();
    }
    return null;
}

export function hydrateUserFromRow(row: Record<string, unknown>): StoredUser {
    const tokenExpiresAt = row.token_expires_at
        ? new Date(row.token_expires_at as string).getTime()
        : undefined;

    return {
        userId: row.user_id as string,
        login: row.login as string,
        displayName: row.display_name as string,
        accessToken: (row.access_token as string) ?? '',
        refreshToken: (row.refresh_token as string) ?? '',
        expiresIn: 0,
        obtainedAt: 0,
        apiKey: (row.api_key as string) ?? undefined,
        apiKeyHash: (row.api_key_hash as string) ?? undefined,
        isActive: row.is_active as boolean,
        blockedReason: (row.blocked_reason as string) ?? undefined,
        customRateLimit: (row.custom_rate_limit as number) ?? undefined,
        customCacheTtl: (row.custom_cache_ttl as number) ?? undefined,
        role: normalizeUserRole(row.role as string | undefined),
        profileImageUrl: (row.profile_image_url as string) ?? undefined,
        timezone: (row.timezone as string) ?? 'UTC',
        lastActive: (row.last_active as string) ?? undefined,
        createdAt: (row.created_at as string) ?? undefined,
        tokenExpiresAt,
        discordId: (row.discord_id as string) ?? null,
        discordUsername: (row.discord_username as string) ?? null,
        discordAvatar: (row.discord_avatar as string) ?? null,
        discordLinkedAt: (row.discord_linked_at as string) ?? null,
        discordUpdatedAt: (row.discord_updated_at as string) ?? null
    };
}

export function userToRow(
    user: StoredUser,
    options?: { preservePlan?: boolean }
): Record<string, unknown> {
    const row: Record<string, unknown> = {
        user_id: user.userId,
        login: user.login,
        display_name: user.displayName,
        access_token: user.accessToken ?? null,
        refresh_token: user.refreshToken ?? null,
        api_key: user.apiKey ?? null,
        api_key_hash: user.apiKeyHash ?? null,
        is_active: user.isActive ?? true,
        blocked_reason: user.blockedReason ?? null,
        profile_image_url: user.profileImageUrl ?? null,
        timezone: user.timezone ?? 'UTC',
        last_active: user.lastActive
            ? new Date(user.lastActive).toISOString()
            : new Date().toISOString(),
        token_expires_at: resolveTokenExpiresAtIso(user)
    };

    if (!options?.preservePlan) {
        row.custom_rate_limit = user.customRateLimit ?? null;
        row.custom_cache_ttl = user.customCacheTtl ?? null;
        row.role = user.role ?? DEFAULT_USER_ROLE;
    }

    if (user.createdAt) {
        row.created_at = new Date(user.createdAt).toISOString();
    }

    if ('discordId' in user) {
        row.discord_id = user.discordId ?? null;
        row.discord_username = user.discordUsername ?? null;
        row.discord_avatar = user.discordAvatar ?? null;
        row.discord_linked_at = user.discordLinkedAt ?? null;
        row.discord_updated_at = user.discordUpdatedAt ?? null;
    }

    return row;
}

export function fromRow(row: Record<string, unknown>): StoredUser {
    return hydrateUserFromRow(row);
}
