import { useTranslation } from '@/core/i18n/I18nContext';
import { panelCard } from '@/core/utils/tw';
import { Skeleton } from './SkeletonPrimitives';
import { ClipsGridSkeleton } from './ClipsGridSkeleton';

/** Filtros + grid como `ClipsView` (fallback de pestaña). */
export function ClipsViewSkeleton() {
    const { t } = useTranslation();
    return (
        <div className="animate-fade-soft space-y-4" aria-busy="true" aria-label={t.globals.loading.clips}>
            <div className={`${panelCard} flex flex-col`}>
                <div className="flex flex-wrap items-center gap-2.5 border-b border-border-subtle px-5 py-3.5">
                    <Skeleton className="size-8 rounded-lg" />
                    <Skeleton className="h-3.5 w-28" />
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <Skeleton className="h-8 w-40 rounded-lg" />
                        <Skeleton className="h-8 w-28 rounded-lg" />
                        <Skeleton className="size-8 rounded-md" />
                        <Skeleton className="size-8 rounded-md" />
                    </div>
                </div>
            </div>
            <ClipsGridSkeleton count={6} />
        </div>
    );
}
