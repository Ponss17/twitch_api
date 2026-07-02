import { fadeIn } from '@/core/ui/tw';
import { rankResourceUsage } from '@/features/dashboard/lib/statsUsage';
import { HomeActivityFeed } from '@/features/dashboard/components/home/HomeActivityFeed';
import { StatsKpiRow } from '@/features/dashboard/components/stats/StatsKpiRow';
import { StatsResourceChart } from '@/features/dashboard/components/stats/StatsResourceChart';
import { StatsCategoryChart } from '@/features/dashboard/components/stats/StatsCategoryChart';
import { useDashboardPanel } from '@/features/dashboard/providers/DashboardPanelProvider';

export function StatsView({ active: _active = true }: { active?: boolean }) {
    const {
        stats,
        activity,
        hasLiveData,
        syncing,
        syncLabel,
        highlightKeys,
        isRealtimeLive
    } = useDashboardPanel();

    const ranked = rankResourceUsage(stats);
    const loading = !hasLiveData;

    return (
        <div className={fadeIn}>
            <StatsKpiRow stats={stats} loading={loading} />

            <div className="mb-3 grid grid-cols-1 gap-3 min-[1100px]:grid-cols-2">
                <StatsResourceChart rows={ranked} loading={loading} />
                <StatsCategoryChart stats={stats} loading={loading} />
            </div>

            <HomeActivityFeed
                activity={activity}
                syncing={syncing}
                syncLabel={syncLabel}
                isLoading={loading}
                isLive={isRealtimeLive}
                highlightKeys={highlightKeys}
                title="Actividad reciente"
                subtitle="Últimos eventos de comandos y herramientas"
            />
        </div>
    );
}
