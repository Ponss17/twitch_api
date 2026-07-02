import { useEffect, useRef, useState } from 'react';
import type { Session } from '@/core/config/config';
import type { DashboardLiveStats } from '@/features/dashboard/lib/dashboardStats';
import type { ActivityLogItem } from '@/features/dashboard/lib/activityLogDisplay';

const loadRealtimeModule = () => import('@/features/dashboard/lib/realtimeService');

export interface UseDashboardRealtimeOptions {
    id: string;
    active: boolean;
    session: Session;
    onStatsUpdate?: (stats: DashboardLiveStats) => void;
    onActivityInsert?: (log: ActivityLogItem) => void;
    /** Llamado si Realtime cae y hay que volver a polling. */
    onDisconnect?: () => void;
}

export function useDashboardRealtime({
    id,
    active,
    session,
    onStatsUpdate,
    onActivityInsert,
    onDisconnect
}: UseDashboardRealtimeOptions): { isLive: boolean } {
    const [isLive, setIsLive] = useState(false);
    const onStatsRef = useRef(onStatsUpdate);
    const onActivityRef = useRef(onActivityInsert);
    const onDisconnectRef = useRef(onDisconnect);

    onStatsRef.current = onStatsUpdate;
    onActivityRef.current = onActivityInsert;
    onDisconnectRef.current = onDisconnect;

    const sessionKey = `${session.userId ?? ''}|${session.apiKey ?? ''}|${session.token ?? ''}`;

    useEffect(() => {
        if (!active || !session.userId) {
            setIsLive(false);
            return;
        }

        let unsubscribe = () => {};
        let cancelled = false;

        void loadRealtimeModule().then(({ RealtimeServiceFactory }) => {
            if (cancelled) return;

            unsubscribe = RealtimeServiceFactory.subscribe(
                id,
                session,
                {
                    onStatsUpdate: (stats) => onStatsRef.current?.(stats),
                    onActivityInsert: (log) => onActivityRef.current?.(log)
                },
                {
                    onDisconnect: () => {
                        setIsLive(false);
                        onDisconnectRef.current?.();
                    },
                    onConnectionChange: (connected) => setIsLive(connected)
                }
            );
        });

        return () => {
            cancelled = true;
            unsubscribe();
            setIsLive(false);
        };
        // sessionKey estabiliza credenciales; el objeto session cambia de identidad sin mutar datos.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, id, sessionKey]);

    return { isLive };
}
