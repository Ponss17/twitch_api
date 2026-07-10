import type { ActivityLogItem } from '../activityLogDisplay';
import type { RawActivityLog } from './types';

export function formatActivityLog(raw: RawActivityLog): ActivityLogItem {
    const type = raw.activity_type || 'other';
    const user = raw.user_name || 'Usuario';

    // Support both old `detail` column (pre-migration) and new `metadata` JSONB column.
    // If metadata is already a populated object from Supabase realtime, use it directly.
    // Otherwise, fall back to wrapping the legacy `detail` string so the display layer
    // can still render something useful via `raw_detail`.
    const metadata: Record<string, unknown> | undefined =
        raw.metadata && typeof raw.metadata === 'object'
            ? (raw.metadata as Record<string, unknown>)
            : raw.detail?.trim()
              ? { raw_detail: raw.detail.trim() }
              : undefined;

    return {
        type,
        user,
        metadata,
        timestamp: raw.created_at || new Date().toISOString()
    };
}
