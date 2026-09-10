import { SIDEBAR_WIDTH_EXPANDED_PX } from '@/core/utils/tw';
import { useTranslation } from '@/core/i18n/I18nContext';
import { Skeleton, SkeletonCircle } from './SkeletonPrimitives';
import { AnalyticsSkeleton } from './AnalyticsSkeleton';
import { ClipsViewSkeleton } from './ClipsViewSkeleton';
import { CommandViewSkeleton } from './CommandViewSkeleton';
import { HomeViewSkeleton } from './HomeViewSkeleton';
import { ReportsSkeleton } from './ReportsSkeleton';
import { SettingsViewSkeleton } from './SettingsViewSkeleton';
import { StalkerViewSkeleton } from './StalkerViewSkeleton';
import { TrendsSkeleton } from './TrendsSkeleton';

/** Spinner de sesión → skeleton del shell del dashboard. */
export function DashboardSessionSkeleton({ tab = 'home' }: { tab?: string }) {
    const { t } = useTranslation();
    let ContentSkeleton = HomeViewSkeleton;
    if (tab === 'analytics') ContentSkeleton = AnalyticsSkeleton;
    else if (tab === 'reports') ContentSkeleton = ReportsSkeleton;
    else if (tab === 'settings') ContentSkeleton = SettingsViewSkeleton;
    else if (tab === 'trends') ContentSkeleton = TrendsSkeleton;
    else if (tab === 'stalker') ContentSkeleton = StalkerViewSkeleton;
    else if (tab === 'clips') ContentSkeleton = ClipsViewSkeleton;
    else if (tab !== 'home') ContentSkeleton = CommandViewSkeleton;

    return (
        <div className="flex min-h-screen bg-bg-main" aria-busy="true" aria-label={t.globals.loading.dashboard}>
            <aside
                className="hidden shrink-0 border-r border-border-subtle p-3 lg:block"
                style={{ width: SIDEBAR_WIDTH_EXPANDED_PX }}
            >
                <div className="mb-6 flex items-center gap-2.5 px-1">
                    <Skeleton className="size-8 shrink-0 rounded-lg" />
                    <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="mb-3 ml-1 h-2.5 w-16" />
                <div className="space-y-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={`a-${i}`} className="h-10 w-full rounded-lg" />
                    ))}
                </div>
                <Skeleton className="mb-3 ml-1 mt-8 h-2.5 w-14" />
                <div className="space-y-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={`b-${i}`} className="h-10 w-full rounded-lg" />
                    ))}
                </div>
            </aside>
            <main className="flex flex-1 flex-col">
                <div className="flex h-14 items-center gap-4 border-b border-border-subtle px-6">
                    <Skeleton className="h-5 w-36" />
                    <div className="ml-auto flex items-center gap-3">
                        <Skeleton className="size-8 rounded-lg" />
                        <SkeletonCircle className="h-8 w-8" />
                    </div>
                </div>
                <div className="mx-auto w-full max-w-[1600px] flex-1 p-6">
                    <ContentSkeleton />
                </div>
            </main>
        </div>
    );
}
