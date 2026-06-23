import { lazy, Suspense, type ReactNode } from 'react';
import type { DashboardTab } from '@/lib/config';
import { useMountedTabs } from '@/lib/useMountedTabs';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { HomeViewSkeleton, ProfileHeroSkeleton } from '@/components/ui/Skeleton';
import { HomeView } from '@/components/views/HomeView';
import { ProfileView } from '@/components/views/ProfileView';

const FollowageView = lazy(() =>
    import('@/components/views/CommandsViews').then((m) => ({ default: m.FollowageView }))
);
const ShoutoutView = lazy(() =>
    import('@/components/views/CommandsViews').then((m) => ({ default: m.ShoutoutView }))
);
const ClipsView = lazy(() => import('@/components/views/ClipsView').then((m) => ({ default: m.ClipsView })));
const Magic8View = lazy(() =>
    import('@/components/views/MinigamesViews').then((m) => ({ default: m.Magic8View }))
);
const DuelView = lazy(() => import('@/components/views/MinigamesViews').then((m) => ({ default: m.DuelView })));
const RussianView = lazy(() =>
    import('@/components/views/MinigamesViews').then((m) => ({ default: m.RussianView }))
);
const FeedbackView = lazy(() =>
    import('@/components/views/MinigamesViews').then((m) => ({ default: m.FeedbackView }))
);
const TrendsView = lazy(() => import('@/components/views/TrendsView').then((m) => ({ default: m.TrendsView })));
const StalkerView = lazy(() => import('@/components/views/StalkerView').then((m) => ({ default: m.StalkerView })));
const RouletteView = lazy(() =>
    import('@/components/views/RouletteView').then((m) => ({ default: m.RouletteView }))
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
