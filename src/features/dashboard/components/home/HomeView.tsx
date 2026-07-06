import type { DashboardTab } from '@/core/config/config';
import { sumDashboardCategoryUsage } from '@/features/dashboard/lib/dashboardStats';
import { HomeHero } from '@/features/dashboard/components/home/HomeHero';
import { HomeActivityFeed } from '@/features/dashboard/components/home/HomeActivityFeed';
import { HomeResourcesPanel } from '@/features/dashboard/components/home/HomeResourcesPanel';
import { useRequiredSession } from '@/core/session/useSession';
import { fadeIn } from '@/core/ui/tw';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/shared/ui/ToastProvider';
import {
    DashboardPanelProvider,
    useDashboardPanel
} from '@/features/dashboard/providers/DashboardPanelProvider';

interface HomeViewProps {
    onNavigate?: (tab: DashboardTab) => void;
    active?: boolean;
}

function HomeViewContent({ onNavigate }: { onNavigate?: (tab: DashboardTab) => void }) {
    const session = useRequiredSession();
    const {
        stats,
        activity,
        hasLiveData,
        error,
        syncing,
        syncLabel,
        highlightKeys,
        isRealtimeLive
    } = useDashboardPanel();

    const displayName = session.displayName ?? session.login ?? 'Streamer';

    if (error && !hasLiveData) {
        return (
            <div className="rounded-xl border border-error/30 bg-[#0f0f11] p-6 text-error">
                <AlertTriangle className="mr-2" />
                {error}
            </div>
        );
    }

    const latencyMs = stats.avgLatencyMs ?? 0;
    const resourceUsage = sumDashboardCategoryUsage(stats);

    return (
        <div className={fadeIn}>
            <HomeHero
                displayName={displayName}
                resourceUsage={resourceUsage}
                successRate={stats.rawSuccessRate ?? 0}
                latencyMs={latencyMs}
                isLoading={!hasLiveData}
            />

            <div className="grid grid-cols-1 items-stretch gap-6 min-[1001px]:grid-cols-[1fr_300px]">
                <HomeActivityFeed
                    activity={activity}
                    syncing={syncing}
                    syncLabel={syncLabel}
                    isLoading={!hasLiveData}
                    isLive={isRealtimeLive}
                    highlightKeys={highlightKeys}
                />
                <HomeResourcesPanel onNavigate={onNavigate} />
            </div>
        </div>
    );
}

export function HomeView({ onNavigate, active = true }: HomeViewProps) {
    const session = useRequiredSession();
    const { showToast } = useToast();

    return (
        <DashboardPanelProvider active={active} session={session} showToast={showToast}>
            <HomeViewContent onNavigate={onNavigate} />
        </DashboardPanelProvider>
    );
}
