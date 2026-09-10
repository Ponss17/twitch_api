import type { DashboardTab } from '@/core/config/config';

import { SettingsHero } from '@/features/dashboard/settings/components/SettingsHero';
import { HomeActivityFeed } from '@/features/dashboard/home/HomeActivityFeed';
import { HomeResourcesPanel } from '@/features/dashboard/home/HomeResourcesPanel';
import { HomeEmptyOnboarding } from '@/features/dashboard/home/HomeEmptyOnboarding';
import { useRequiredSession } from '@/core/session/useSession';
import { fadeIn } from '@/core/utils/tw';
import { useDashboardPanel } from '@/features/dashboard/providers/DashboardPanelProvider';
import { useTranslation } from '@/core/i18n/I18nContext';
import { formatDate } from '@/core/utils/utils';
import { PanelLoadError } from '@/shared/ui/PanelLoadError';

interface HomeViewProps {
    onNavigate?: (tab: DashboardTab) => void;
    active?: boolean;
}

function HomeViewContent({ onNavigate }: { onNavigate?: (tab: DashboardTab) => void }) {
    useRequiredSession();
    const {
        activity,
        profile,
        stats,
        hasLiveData,
        error,
        syncing,
        syncLabel,
        highlightKeys,
        isRealtimeLive,
        refreshPanel
    } = useDashboardPanel();
    const { t, locale } = useTranslation();

    if (error && !hasLiveData) {
        return (
            <PanelLoadError
                message={error}
                onRetry={() => void refreshPanel()}
                retrying={syncing}
            />
        );
    }

    const broadcasterLabel = (type?: string): string => {
        if (type === 'partner') return t.home.broadcaster.partner;
        if (type === 'affiliate') return t.home.broadcaster.affiliate;
        return t.home.broadcaster.streamer;
    };

    const showOnboarding = hasLiveData && activity.length === 0;

    return (
        <div className={fadeIn}>
            <SettingsHero
                followers={profile?.followers}
                broadcasterLabel={broadcasterLabel(profile?.broadcaster_type)}
                memberSince={formatDate(profile?.created_at ?? '', locale)}
                isLive={profile?.isLive}
                isLoading={!hasLiveData}
            />

            {showOnboarding ? <HomeEmptyOnboarding onNavigate={onNavigate} /> : null}

            <div className="grid grid-cols-1 items-stretch gap-5 min-[1001px]:grid-cols-[1fr_310px]">
                <HomeActivityFeed
                    activity={activity}
                    syncing={syncing}
                    syncLabel={syncLabel}
                    isLoading={!hasLiveData}
                    isLive={isRealtimeLive}
                    compactEmpty={showOnboarding}
                    highlightKeys={highlightKeys}
                    timeZone={profile?.timezone}
                    title={t.home.activityFeed.title}
                />
                <HomeResourcesPanel onNavigate={onNavigate} stats={stats} />
            </div>
        </div>
    );
}

export function HomeView({ onNavigate }: HomeViewProps) {
    useRequiredSession();
    return <HomeViewContent onNavigate={onNavigate} />;
}
