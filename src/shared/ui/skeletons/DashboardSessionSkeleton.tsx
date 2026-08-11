import { useTranslation } from '@/core/i18n/I18nContext';
import { Skeleton, SkeletonCircle } from './SkeletonPrimitives';
import { AnalyticsSkeleton } from './AnalyticsSkeleton';
import { ClipsGridSkeleton } from './ClipsGridSkeleton';
import { CommandViewSkeleton } from './CommandViewSkeleton';
import { HomeViewSkeleton } from './HomeViewSkeleton';
import { SettingsViewSkeleton } from './SettingsViewSkeleton';
import { StalkerViewSkeleton } from './StalkerViewSkeleton';
import { TrendsSkeleton } from './TrendsSkeleton';

/** Spinner de sesión → skeleton del shell del dashboard. */
export function DashboardSessionSkeleton({ tab = 'home' }: { tab?: string }) {
    const { t } = useTranslation();
    let ContentSkeleton = HomeViewSkeleton;
    if (tab === 'analytics') ContentSkeleton = AnalyticsSkeleton;
    else if (tab === 'settings') ContentSkeleton = SettingsViewSkeleton;
    else if (tab === 'trends') ContentSkeleton = TrendsSkeleton;
    else if (tab === 'stalker') ContentSkeleton = StalkerViewSkeleton;
    else if (tab === 'clips') ContentSkeleton = () => <div className="animate-fade-soft" aria-busy="true"><ClipsGridSkeleton /></div>;
    else if (tab !== 'home') ContentSkeleton = CommandViewSkeleton;

    return (
        <div className="flex min-h-screen bg-bg-main" aria-busy="true" aria-label={t.globals.loading.dashboard}>
            <aside className="hidden w-[240px] shrink-0 p-4 lg:block">
                <Skeleton className="mb-6 h-10 w-40 bg-transparent" />
                <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))}
                </div>
            </aside>
            <main className="flex flex-1 flex-col">
                <div className="flex h-20 items-center gap-4 border-b border-border-strong px-6">
                    <Skeleton className="h-8 w-48" />
                    <div className="ml-auto flex items-center gap-3">
                        <SkeletonCircle className="h-9 w-9" />
                        <Skeleton className="hidden h-4 w-24 md:block" />
                    </div>
                </div>
                <div className="mx-auto w-full max-w-[1600px] flex-1 p-6">
                    <ContentSkeleton />
                </div>
            </main>
        </div>
    );
}
