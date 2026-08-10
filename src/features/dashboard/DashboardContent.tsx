import { lazy, Suspense, type ReactNode } from 'react';
import type { DashboardTab } from '@/core/config/config';
import { useMountedTabs } from '@/features/dashboard/hooks/useMountedTabs';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { 
    HomeViewSkeleton, 
    SettingsViewSkeleton,
    AnalyticsSkeleton,
    TrendsSkeleton,
    StalkerViewSkeleton,
    ClipsGridSkeleton,
    CommandViewSkeleton 
} from '@/shared/ui/Skeleton';
import { useTranslation } from '@/core/i18n/I18nContext';

const HomeView = lazy(() =>
    import('@/features/dashboard/home/HomeView').then((m) => ({ default: m.HomeView }))
);
const AnalyticsView = lazy(() =>
    import('@/features/dashboard/analytics/AnalyticsView').then((m) => ({ default: m.AnalyticsView }))
);
const SettingsView = lazy(() =>
    import('@/features/dashboard/settings/SettingsView').then((m) => ({ default: m.SettingsView }))
);
const FollowageView = lazy(() =>
    import('@/features/commands/views/FollowageView').then((m) => ({ default: m.FollowageView }))
);
const WatchtimeView = lazy(() =>
    import('@/features/commands/views/WatchtimeView').then((m) => ({ default: m.WatchtimeView }))
);
const ShoutoutView = lazy(() =>
    import('@/features/commands/views/ShoutoutView').then((m) => ({ default: m.ShoutoutView }))
);
const ClipsView = lazy(() => import('@/features/clips/ClipsView').then((m) => ({ default: m.ClipsView })));
const Magic8View = lazy(() =>
    import('@/features/minigames/views/Magic8View').then((m) => ({ default: m.Magic8View }))
);
const DuelView = lazy(() =>
    import('@/features/minigames/views/DuelView').then((m) => ({ default: m.DuelView }))
);
const RussianView = lazy(() =>
    import('@/features/minigames/views/RussianView').then((m) => ({ default: m.RussianView }))
);
const SlotsView = lazy(() =>
    import('@/features/minigames/views/SlotsView').then((m) => ({ default: m.SlotsView }))
);
const FeedbackView = lazy(() =>
    import('@/features/feedback/FeedbackView').then((m) => ({ default: m.FeedbackView }))
);
const TrendsView = lazy(() =>
    import('@/features/tools/trends/TrendsView').then((m) => ({ default: m.TrendsView }))
);
const StalkerView = lazy(() =>
    import('@/features/tools/stalker/StalkerView').then((m) => ({ default: m.StalkerView }))
);
const RouletteView = lazy(() =>
    import('@/features/tools/roulette/RouletteView').then((m) => ({ default: m.RouletteView }))
);
const QuestionsView = lazy(() =>
    import('@/features/tools/questions/QuestionsView').then((m) => ({ default: m.QuestionsView }))
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
    if (tab === 'settings') return <SettingsViewSkeleton />;
    if (tab === 'analytics') return <AnalyticsSkeleton />;
    if (tab === 'trends') return <TrendsSkeleton />;
    if (tab === 'stalker') return <StalkerViewSkeleton />;
    if (tab === 'clips') return <div className="animate-fade-soft" aria-busy="true"><ClipsGridSkeleton /></div>;
    if (tab === 'home') return <HomeViewSkeleton />;
    
    // Fallback genérico para vistas de comandos y minijuegos (Overlay, Magic8, Followage, etc.)
    return <CommandViewSkeleton />;
}

function renderTabPanel(tab: DashboardTab, { active, onNavigate }: TabPanelProps): ReactNode {
    switch (tab) {
        case 'home':
            return <HomeView active={active} onNavigate={onNavigate} />;
        case 'analytics':
            return <AnalyticsView active={active} />;
        case 'followage':
            return <FollowageView />;
        case 'watchtime':
            return <WatchtimeView />;
        case 'clips':
            return <ClipsView active={active} />;
        case 'shoutout':
            return <ShoutoutView />;
        case 'settings':
            return <SettingsView active={active} />;
        case 'magic8':
            return <Magic8View />;
        case 'duel':
            return <DuelView />;
        case 'russian':
            return <RussianView />;
        case 'slots':
            return <SlotsView />;
        case 'questions':
            return <QuestionsView active={active} />;
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
    const { t } = useTranslation();

    return (
        <>
            {Array.from(mountedTabs).map((panelTab) => {
                const isActive = panelTab === tab;
                const errorTitle = `${t.common.tabError} «${panelTab}»`;
                return (
                    <div
                        key={panelTab}
                        className={isActive ? 'animate-tab-in' : 'hidden'}
                        aria-hidden={!isActive}
                    >
                        <ErrorBoundary title={errorTitle}>
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
