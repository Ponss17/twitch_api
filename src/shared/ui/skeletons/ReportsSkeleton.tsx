import { useTranslation } from '@/core/i18n/I18nContext';
import { panelCard } from '@/core/utils/tw';
import { Skeleton } from './SkeletonPrimitives';

/** Cuerpo de la carta del informe (también al cambiar de mes). */
export function ReportsArticleSkeleton() {
    return (
        <>
            <div className="border-b border-border-subtle px-5 py-5 sm:px-7">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="mt-3 h-7 w-64 max-w-full" />
                <Skeleton className="mt-2 h-3 w-40" />
            </div>
            <div className="space-y-4 px-5 py-6 sm:px-7">
                <Skeleton className="h-2.5 w-28" />
                <Skeleton className="h-16 w-full max-w-2xl" />
                <Skeleton className="h-3 w-52" />
                <div className="space-y-3 border-t border-border-subtle pt-6">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                    <Skeleton className="mt-4 h-3.5 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                </div>
                <div className="border-t border-border-subtle pt-5">
                    <Skeleton className="h-2.5 w-32" />
                    <div className="mt-3 grid max-w-md grid-cols-2 gap-2">
                        <Skeleton className="h-9 w-full rounded-lg" />
                        <Skeleton className="h-9 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        </>
    );
}

/** Skeleton: archivo de meses + carta del informe. */
export function ReportsSkeleton() {
    const { t } = useTranslation();
    return (
        <div
            className="grid animate-fade-soft gap-4 lg:grid-cols-[12rem_minmax(0,1fr)]"
            aria-busy="true"
            aria-label={t.globals.loading.reports}
        >
            <aside className={panelCard}>
                <div className="border-b border-border-subtle px-3.5 py-2.5">
                    <Skeleton className="h-2.5 w-14" />
                </div>
                <div className="space-y-1 p-1.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-lg px-2.5 py-2">
                            <Skeleton className="h-3.5 w-24" />
                        </div>
                    ))}
                </div>
            </aside>
            <article className={`${panelCard} overflow-hidden`}>
                <ReportsArticleSkeleton />
            </article>
        </div>
    );
}
