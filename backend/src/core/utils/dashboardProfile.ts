import type { TwitchUser } from '../../types/twitch';
import type { ResolvedUserLimits } from '../config/userRoles';
import type { DashboardProfile } from '../schemas/dashboardContracts';

export type { DashboardProfile } from '../schemas/dashboardContracts';

export function buildDashboardProfile(
    info: TwitchUser,
    followers: number,
    isLive: boolean,
    limits?: ResolvedUserLimits,
    discord?: {
        discordId?: string | null;
        discordUsername?: string | null;
        discordAvatar?: string | null;
    } | null
): DashboardProfile {
    return {
        id: info.id,
        login: info.login,
        display_name: info.display_name,
        broadcaster_type: info.broadcaster_type,
        description: info.description,
        profile_image_url: info.profile_image_url,
        created_at: info.created_at,
        view_count: info.view_count,
        followers,
        views: info.view_count,
        isLive,
        ...(limits
            ? {
                  role: limits.role,
                  roleLabel: limits.roleLabel,
                  rateLimit: limits.rateLimit,
                  hasCustomRateLimit: limits.hasCustomRateLimit,
                  hasCustomCacheTtl: limits.hasCustomCacheTtl
              }
            : {}),
        ...(discord
            ? {
                  discordId: discord.discordId ?? null,
                  discordUsername: discord.discordUsername ?? null,
                  discordAvatar: discord.discordAvatar ?? null
              }
            : {})
    };
}
