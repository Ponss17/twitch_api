import type { Session } from '@/core/config/config';
import type { ActivityLogItem } from '../activityLogDisplay';
import type { RealtimeStatsUpdate } from '../dashboardStats';

export interface RawActivityLog {
    activity_type?: string;
    user_name?: string;
    detail?: string;
    metadata?: Record<string, unknown>;
    created_at?: string;
}

export interface RealtimeCallbacks {
    onStatsUpdate: (stats: RealtimeStatsUpdate) => void;
    onActivityInsert: (log: ActivityLogItem) => void;
    /** Llamado cuando se detectan DELETEs en activity_logs (borrado masivo desde zona peligrosa). */
    onActivityDelete?: () => void;
}

export interface RealtimeSubscribeOptions {
    onDisconnect?: () => void;
    onConnectionChange?: (connected: boolean) => void;
}

export interface SubscriberEntry {
    session: Session;
    callbacks: RealtimeCallbacks;
    options: RealtimeSubscribeOptions;
}
