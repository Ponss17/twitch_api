import { useEffect, useState } from 'react';
import type { DashboardTab } from '@/core/config/config';

/** Tabs ya visitadas — se mantienen montadas (keep-alive) al cambiar de sección */
export function useMountedTabs(activeTab: DashboardTab): Set<DashboardTab> {
    const [mountedTabs, setMountedTabs] = useState<Set<DashboardTab>>(() => new Set([activeTab]));

    useEffect(() => {
        setMountedTabs((prev) => {
            if (prev.has(activeTab)) return prev;
            const next = new Set(prev);
            next.add(activeTab);
            return next;
        });
    }, [activeTab]);

    return mountedTabs;
}
