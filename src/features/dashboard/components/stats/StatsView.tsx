import { fadeIn } from '@/core/ui/tw';
import { useDashboardPanel } from '@/features/dashboard/providers/DashboardPanelProvider';
import { StatsConstructionNotice } from '@/features/dashboard/components/stats/StatsConstructionNotice';
import { StatsResourceGrid } from '@/features/dashboard/components/stats/StatsResourceGrid';
import { StatsSummarySection } from '@/features/dashboard/components/stats/StatsSummarySection';

export function StatsView({ active: _active = true }: { active?: boolean }) {
    const { stats, hasLiveData, syncing, syncLabel } = useDashboardPanel();
    const loading = !hasLiveData;

    return (
        <div className={`${fadeIn} space-y-0`}>
            <StatsSummarySection stats={stats} loading={loading} syncing={syncing} syncLabel={syncLabel} />
            <StatsResourceGrid stats={stats} loading={loading} delay={120} />
            <StatsConstructionNotice delay={180} />
        </div>
    );
}
