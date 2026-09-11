import type { Session } from '@/core/config/config';
import type { ActivityLogItem } from '../logs/activityLogDisplay';
import type { RealtimeStatsUpdate } from '../data/dashboardStats';
import type { ServerNotification } from '@/features/dashboard/reports/reportsApi';

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
    onNotification?: (notification: ServerNotification) => void;
}

export interface RealtimeSubscribeOptions {
    onDisconnect?: () => void;
    onConnectionChange?: (connected: boolean) => void;
    timezone?: string;
}

export interface SubscriberEntry {
    session: Session;
    callbacks: RealtimeCallbacks;
    options: RealtimeSubscribeOptions;
}
