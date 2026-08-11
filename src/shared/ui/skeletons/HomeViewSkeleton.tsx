import { useTranslation } from '@/core/i18n/I18nContext';
import { Skeleton } from './SkeletonPrimitives';
import { SettingsHeroSkeleton } from './SettingsSkeletons';

export function HomeViewSkeleton() {
    const { t } = useTranslation();
    return (
        <div className="animate-fade-soft" aria-busy="true" aria-label={t.globals.loading.panel}>
            <SettingsHeroSkeleton />
            <div className="grid grid-cols-1 items-stretch gap-5 min-[1001px]:grid-cols-[1fr_310px]">
                <div className="flex flex-col rounded-xl border border-border-subtle bg-bg-card h-[510px]">
                    <div className="flex shrink-0 items-center gap-3 border-b border-border-subtle px-5 py-3.5">
                        <Skeleton className="h-8 w-8 rounded-lg bg-transparent border border-border-subtle" />
                        <Skeleton className="h-4 w-40 bg-transparent" />
                    </div>
                    <div className="flex-1 p-5 space-y-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="h-8 w-8 rounded-full bg-text-main/5" />
                                <div className="space-y-2 flex-1 pt-1.5">
                                    <Skeleton className="h-3 w-3/4 max-w-[200px]" />
                                    <Skeleton className="h-2 w-1/2 max-w-[150px]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col rounded-xl border border-border-subtle bg-bg-card h-[510px]">
                    <div className="flex shrink-0 items-center gap-3 border-b border-border-subtle px-5 py-3.5">
                        <Skeleton className="h-8 w-8 rounded-lg bg-transparent border border-border-subtle" />
                        <Skeleton className="h-4 w-24 bg-transparent" />
                    </div>
                    <div className="flex-1 p-4 flex flex-col gap-6">
                        <div className="space-y-2">
                            <Skeleton className="h-2.5 w-32 bg-transparent mb-3" />
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton className="h-[44px] w-full rounded-lg bg-transparent border border-border-subtle" key={i} />
                            ))}
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-2.5 w-24 bg-transparent mb-3" />
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton className="h-[44px] w-full rounded-lg bg-transparent border border-border-subtle" key={i} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
