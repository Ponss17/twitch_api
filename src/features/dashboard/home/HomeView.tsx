import type { DashboardTab } from '@/core/config/config';

import { SettingsHero } from '@/features/dashboard/settings/SettingsHero';
import { HomeActivityFeed } from '@/features/dashboard/home/HomeActivityFeed';
import { HomeResourcesPanel } from '@/features/dashboard/home/HomeResourcesPanel';
import { FeatureAnnouncementBanner } from '@/features/dashboard/announcements/FeatureAnnouncementBanner';
import { useRequiredSession } from '@/core/session/useSession';
import { fadeIn } from '@/core/utils/tw';
import { AlertTriangle } from 'lucide-react';
import { useDashboardPanel } from '@/features/dashboard/providers/DashboardPanelProvider';
import { useTranslation } from '@/core/i18n/I18nContext';
import { formatDate } from '@/core/utils/utils';

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
    const { t, locale } = useTranslation();

    if (error && !hasLiveData) {
        return (
            <div className="rounded-xl border border-error/30 bg-error/[0.05] p-6 text-error">
                <AlertTriangle className="mr-2" />
                {error}
            </div>
        );
    }

    const broadcasterLabel = (type?: string): string => {
        if (type === 'partner') return t.home.broadcaster.partner;
        if (type === 'affiliate') return t.home.broadcaster.affiliate;
        return t.home.broadcaster.streamer;
    };

    return (
        <div className={fadeIn}>
            <FeatureAnnouncementBanner surface="home" />

            <SettingsHero
                followers={profile?.followers}
                broadcasterLabel={broadcasterLabel(profile?.broadcaster_type)}
                memberSince={formatDate(profile?.created_at ?? '', locale)}
                isLive={profile?.isLive}
                isLoading={!hasLiveData}
            />

            <div className="grid grid-cols-1 items-stretch gap-5 min-[1001px]:grid-cols-[1fr_310px]">
                <HomeActivityFeed
                    activity={activity}
                    syncing={syncing}
                    syncLabel={syncLabel}
                    isLoading={!hasLiveData}
                    isLive={isRealtimeLive}
                    highlightKeys={highlightKeys}
                    timeZone={profile?.timezone}
                    title={t.home.activityFeed.title}
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
