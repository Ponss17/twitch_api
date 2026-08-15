import { useTranslation } from '@/core/i18n/I18nContext';
import { Skeleton } from './SkeletonPrimitives';

export function AnalyticsSkeleton() {
    const { t } = useTranslation();
    return (
        <div className="animate-fade-soft space-y-5" aria-busy="true" aria-label={t.globals.loading.analytics}>
            <div className="rounded-xl border border-border-subtle bg-bg-card">
                <div className="flex items-center justify-between border-b border-border-subtle px-5 py-2.5">
                    <Skeleton className="h-4 w-40 bg-transparent" />
                    <Skeleton className="h-7 w-28 rounded-md bg-transparent" />
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-2 py-1">
                            <Skeleton className="h-3 w-20 bg-transparent" />
                            <Skeleton className="h-7 w-24 bg-transparent" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex h-[320px] flex-col rounded-xl border border-border-subtle bg-bg-card">
                <div className="flex items-center justify-between border-b border-border-subtle px-5 py-2.5">
                    <Skeleton className="h-4 w-44 bg-transparent" />
                    <Skeleton className="h-4 w-28 bg-transparent" />
                </div>
                <div className="flex flex-1 flex-col justify-between p-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-px w-full bg-border-subtle" />
                    ))}
                    <Skeleton className="mt-3 h-24 w-full rounded-t-xl bg-gradient-to-t from-primary/[0.03] to-transparent" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="flex h-[270px] flex-col rounded-xl border border-border-subtle bg-bg-card">
                    <div className="flex items-center justify-between border-b border-border-subtle px-5 py-2.5">
                        <Skeleton className="h-4 w-32 bg-transparent" />
                        <Skeleton className="h-4 w-12 bg-transparent" />
                    </div>
                    <div className="flex flex-1 flex-col px-5 pb-3 pt-2">
                        <div className="mb-2 flex justify-between border-b border-border-subtle pb-2">
                            <Skeleton className="h-3 w-16 bg-transparent" />
                            <Skeleton className="h-3 w-10 bg-transparent" />
                        </div>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between py-2.5">
                                <Skeleton className="h-3.5 w-28 bg-transparent" />
                                <Skeleton className="h-3.5 w-8 bg-transparent" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex h-[270px] flex-col rounded-xl border border-border-subtle bg-bg-card">
                    <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-2.5">
                        <Skeleton className="h-4 w-44 bg-transparent" />
                    </div>
                    <div className="flex flex-1 flex-col px-5 pb-3 pt-2">
                        <div className="mb-2 flex justify-between border-b border-border-subtle pb-2">
                            <Skeleton className="h-3 w-20 bg-transparent" />
                            <Skeleton className="h-3 w-14 bg-transparent" />
                        </div>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between py-2.5">
                                <Skeleton className="h-3.5 w-24 bg-transparent" />
                                <Skeleton className="h-3.5 w-12 bg-transparent" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
