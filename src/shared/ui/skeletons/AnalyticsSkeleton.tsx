import { useTranslation } from '@/core/i18n/I18nContext';
import { panelCard } from '@/core/utils/tw';
import { Skeleton } from './SkeletonPrimitives';

const panel = panelCard;

export function AnalyticsSkeleton() {
    const { t } = useTranslation();
    return (
        <div
            className="animate-fade-soft space-y-4"
            aria-busy="true"
            aria-label={t.globals.loading.analytics}
        >
            <section className={`${panel} shrink-0`}>
                <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-2.5">
                    <Skeleton className="h-4 w-36" />
                    <div className="flex gap-1.5">
                        <Skeleton className="h-7 w-12 rounded-lg" />
                        <Skeleton className="h-7 w-12 rounded-lg" />
                        <Skeleton className="h-7 w-12 rounded-lg" />
                    </div>
                </header>
                <div className="grid grid-cols-1 px-5 py-2 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className={`flex flex-col gap-1.5 px-1 py-1 ${
                                i === 0
                                    ? 'pb-3 md:pr-5 lg:pb-0'
                                    : 'border-t border-border-strong py-3 md:border-l md:border-t-0 md:px-5 lg:py-0'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <Skeleton className="h-2.5 w-20" />
                                <Skeleton className="size-6 rounded-md" />
                            </div>
                            <Skeleton className="h-7 w-16" />
                            <Skeleton className="h-2 w-24" />
                        </div>
                    ))}
                </div>
            </section>

            <section className={`${panel} flex h-[280px] flex-col`}>
                <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-2.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="size-3.5 rounded-full" />
                </header>
                <div className="flex min-h-0 flex-1 items-end justify-center gap-2.5 px-5 pb-4 pt-5">
                    {[38, 62, 45, 78, 52, 70, 40, 58].map((h, i) => (
                        <Skeleton
                            key={i}
                            className="w-[22px] shrink-0 rounded-t-md"
                            style={{ height: `${h}%` }}
                        />
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {Array.from({ length: 2 }).map((_, panelIdx) => (
                    <section key={panelIdx} className={`${panel} flex h-[244px] flex-col`}>
                        <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-2.5">
                            <Skeleton className="h-4 w-32" />
                            {panelIdx === 0 ? <Skeleton className="h-3 w-8" /> : null}
                        </header>
                        <div className="flex min-h-0 flex-1 flex-col px-5 pb-3 pt-2">
                            <div className="mb-1 flex justify-between gap-3 border-b border-border-subtle pb-2">
                                <Skeleton className="h-2.5 w-16" />
                                <Skeleton className="h-2.5 w-10" />
                                {panelIdx === 1 ? <Skeleton className="h-2.5 w-14" /> : null}
                            </div>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between gap-3 py-2"
                                >
                                    <Skeleton className="h-3.5 w-28" />
                                    <Skeleton className="h-3.5 w-8" />
                                    {panelIdx === 1 ? <Skeleton className="h-3.5 w-12" /> : null}
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
