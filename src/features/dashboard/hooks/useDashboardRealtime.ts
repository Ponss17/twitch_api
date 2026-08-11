import { useEffect, useRef, useState } from 'react';
import type { Session } from '@/core/config/config';
import type { RealtimeStatsUpdate } from '@/features/dashboard/lib/dashboardStats';
import type { ActivityLogItem } from '@/features/dashboard/lib/activityLogDisplay';

const loadRealtimeModule = () => import('@/features/dashboard/lib/realtime');

export interface UseDashboardRealtimeOptions {
    id: string;
    active: boolean;
    session: Session;
    timezone?: string;
    onStatsUpdate?: (stats: RealtimeStatsUpdate) => void;
    onActivityInsert?: (log: ActivityLogItem) => void;
    onDisconnect?: () => void;
}

export function useDashboardRealtime({
    id,
    active,
    session,
    timezone,
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

    const sessionKey = session.userId ?? '';

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
                    timezone,
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
    }, [active, id, sessionKey, timezone]);

    return { isLive };
}
