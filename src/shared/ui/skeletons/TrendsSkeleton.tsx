import { useTranslation } from '@/core/i18n/I18nContext';
import { panelCard } from '@/core/utils/tw';
import { Skeleton } from './SkeletonPrimitives';
import { ToolPanelHeaderSkeleton } from './SectionSkeletons';

/** Shell de Trends: ToolPanelHeader + config + filas de leaderboard. */
export function TrendsSkeleton() {
    const { t } = useTranslation();
    return (
        <div
            className={`${panelCard} mb-3 flex animate-fade-soft flex-col`}
            aria-busy="true"
            aria-label={t.globals.loading.trends}
        >
            <ToolPanelHeaderSkeleton withConfigBar />
            <div className="min-h-0 flex-1 space-y-2.5 overflow-hidden p-5">
                {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5">
                        <Skeleton className="h-3.5 w-5 shrink-0" />
                        <Skeleton className="size-8 shrink-0 rounded-full" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <Skeleton
                                className="h-3.5"
                                style={{ width: `${28 + (i % 4) * 8}%` }}
                            />
                            <Skeleton
                                className="h-2 rounded-full"
                                style={{ width: `${70 - i * 6}%` }}
                            />
                        </div>
                        <Skeleton className="h-3.5 w-8 shrink-0" />
                    </div>
                ))}
            </div>
        </div>
    );
}
