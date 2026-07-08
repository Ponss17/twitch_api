import type { TwitchUser } from '../../types/twitch';
import type { ResolvedUserLimits } from '../config/userRoles';
import type { DashboardProfile } from '../schemas/dashboardContracts';

export type { DashboardProfile } from '../schemas/dashboardContracts';

export function buildDashboardProfile(
    info: TwitchUser,
    followers: number,
    limits?: ResolvedUserLimits
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
        ...(limits
            ? {
                  role: limits.role,
                  roleLabel: limits.roleLabel,
                  rateLimit: limits.rateLimit,
                  hasCustomRateLimit: limits.hasCustomRateLimit,
                  hasCustomCacheTtl: limits.hasCustomCacheTtl
              }
            : {})
    };
}
