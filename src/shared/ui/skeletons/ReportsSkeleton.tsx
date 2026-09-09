import { useTranslation } from '@/core/i18n/I18nContext';
import { panelCard } from '@/core/utils/tw';
import { Skeleton } from './SkeletonPrimitives';

/** Skeleton: rail de meses + detalle (mismo shell que ReportsView). */
export function ReportsSkeleton() {
    const { t } = useTranslation();
    return (
        <div
            className="grid animate-fade-soft gap-4 lg:grid-cols-[13.5rem_minmax(0,1fr)]"
            aria-busy="true"
            aria-label={t.globals.loading.reports}
        >
            <aside className={panelCard}>
                <div className="border-b border-border-subtle px-3.5 py-2.5">
                    <Skeleton className="h-2.5 w-16" />
                </div>
                <div className="space-y-1 p-1.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2"
                        >
                            <Skeleton className="h-3.5 w-24" />
                            <Skeleton className="h-3 w-5" />
                        </div>
                    ))}
                </div>
            </aside>
            <article className={`${panelCard} overflow-hidden`}>
                <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-40" />
                        <Skeleton className="h-5 w-56" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-28 rounded-lg" />
                        <Skeleton className="h-8 w-24 rounded-lg" />
                    </div>
                </div>
                <div className="space-y-4 px-5 py-5">
                    <Skeleton className="h-12 w-full max-w-xl" />
                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-8 w-32 rounded-lg" />
                        <Skeleton className="h-8 w-28 rounded-lg" />
                        <Skeleton className="h-8 w-36 rounded-lg" />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Skeleton className="h-28 rounded-xl" />
                        <Skeleton className="h-28 rounded-xl" />
                    </div>
                </div>
            </article>
        </div>
    );
}
