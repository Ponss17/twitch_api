import type { DashboardTab } from '@/core/config/config';

import { SettingsHero } from '@/features/dashboard/components/settings/SettingsHero';
import { HomeActivityFeed } from '@/features/dashboard/components/home/HomeActivityFeed';
import { HomeResourcesPanel } from '@/features/dashboard/components/home/HomeResourcesPanel';
import { useRequiredSession } from '@/core/session/useSession';
import { fadeIn } from '@/core/ui/tw';
import { AlertTriangle } from 'lucide-react';
import { useDashboardPanel } from '@/features/dashboard/providers/DashboardPanelProvider';

interface HomeViewProps {
    onNavigate?: (tab: DashboardTab) => void;
    active?: boolean;
}

function HomeViewContent({ onNavigate }: { onNavigate?: (tab: DashboardTab) => void }) {
    useRequiredSession();
    const {
        activity,
        profile,
        hasLiveData,
        error,
        syncing,
        syncLabel,
        highlightKeys,
        isRealtimeLive
    } = useDashboardPanel();

    if (error && !hasLiveData) {
        return (
            <div className="rounded-xl border border-error/30 bg-[#0f0f11] p-6 text-error">
                <AlertTriangle className="mr-2" />
                {error}
            </div>
        );
    }

    const broadcasterLabel = (type?: string): string => {
        if (type === 'partner') return 'Partner';
        if (type === 'affiliate') return 'Afiliado';
        return 'Streamer';
    };

    const formatMemberSince = (iso?: string): string => {
        if (!iso) return '---';
        try {
            return new Date(iso).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return '---';
        }
    };

    return (
        <div className={fadeIn}>
            <SettingsHero

                followers={profile?.followers}
                broadcasterLabel={broadcasterLabel(profile?.broadcaster_type)}
                memberSince={formatMemberSince(profile?.created_at)}
                isLive={profile?.isLive}
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

export function HomeView({ onNavigate }: HomeViewProps) {
    useRequiredSession();
    return <HomeViewContent onNavigate={onNavigate} />;
}
