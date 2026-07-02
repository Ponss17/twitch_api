import { lazy, Suspense, type ReactNode } from 'react';
import type { DashboardTab } from '@/core/config/config';
import { useMountedTabs } from '@/features/dashboard/hooks/useMountedTabs';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { HomeViewSkeleton, ProfileHeroSkeleton } from '@/shared/ui/Skeleton';
import { HomeView } from '@/features/dashboard/components/home/HomeView';
import { ProfileView } from '@/features/dashboard/components/profile/ProfileView';
import { StatsView } from '@/features/dashboard/components/stats/StatsView';

const FollowageView = lazy(() =>
    import('@/features/commands/components/CommandsViews').then((m) => ({ default: m.FollowageView }))
);
const ShoutoutView = lazy(() =>
    import('@/features/commands/components/CommandsViews').then((m) => ({ default: m.ShoutoutView }))
);
const ClipsView = lazy(() => import('@/features/clips/components/ClipsView').then((m) => ({ default: m.ClipsView })));
const Magic8View = lazy(() =>
    import('@/features/minigames/components/MinigamesViews').then((m) => ({ default: m.Magic8View }))
);
const DuelView = lazy(() => import('@/features/minigames/components/MinigamesViews').then((m) => ({ default: m.DuelView })));
const RussianView = lazy(() =>
    import('@/features/minigames/components/MinigamesViews').then((m) => ({ default: m.RussianView }))
);
const FeedbackView = lazy(() =>
    import('@/features/feedback/components/FeedbackView').then((m) => ({ default: m.FeedbackView }))
);
const TrendsView = lazy(() =>
    import('@/features/tools/trends/components/TrendsView').then((m) => ({ default: m.TrendsView }))
);
const StalkerView = lazy(() =>
    import('@/features/tools/stalker/StalkerView').then((m) => ({ default: m.StalkerView }))
);
const RouletteView = lazy(() =>
    import('@/features/tools/roulette/components/RouletteView').then((m) => ({ default: m.RouletteView }))
);

interface DashboardContentProps {
    tab: DashboardTab;
    onNavigate?: (tab: DashboardTab) => void;
}

interface TabPanelProps {
    active: boolean;
    onNavigate?: (tab: DashboardTab) => void;
}

function TabFallback({ tab }: { tab: DashboardTab }) {
    if (tab === 'profile') return <ProfileHeroSkeleton />;
    if (tab === 'stats') return <HomeViewSkeleton />;
    return <HomeViewSkeleton />;
}

function renderTabPanel(tab: DashboardTab, { active, onNavigate }: TabPanelProps): ReactNode {
    switch (tab) {
        case 'home':
            return <HomeView active={active} onNavigate={onNavigate} />;
        case 'followage':
            return <FollowageView />;
        case 'clips':
            return <ClipsView />;
        case 'shoutout':
            return <ShoutoutView />;
        case 'profile':
            return <ProfileView active={active} />;
        case 'stats':
            return <StatsView active={active} />;
        case 'magic8':
            return <Magic8View />;
        case 'duel':
            return <DuelView />;
        case 'russian':
            return <RussianView />;
        case 'feedback':
            return <FeedbackView />;
        case 'trends':
            return <TrendsView active={active} />;
        case 'stalker':
            return <StalkerView active={active} />;
        case 'roulette':
            return <RouletteView active={active} />;
        default:
            return null;
    }
}

export function DashboardContent({ tab, onNavigate }: DashboardContentProps) {
    const mountedTabs = useMountedTabs(tab);

    return (
        <>
            {Array.from(mountedTabs).map((panelTab) => {
                const isActive = panelTab === tab;
                return (
                    <div
                        key={panelTab}
                        className={isActive ? 'animate-tab-in' : 'hidden'}
                        aria-hidden={!isActive}
                    >
                        <ErrorBoundary title={`Error al cargar la pestaña «${panelTab}»`}>
                            <Suspense fallback={isActive ? <TabFallback tab={panelTab} /> : null}>
                                {renderTabPanel(panelTab, { active: isActive, onNavigate })}
                            </Suspense>
                        </ErrorBoundary>
                    </div>
                );
            })}
        </>
    );
}
