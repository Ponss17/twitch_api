import { useTranslation } from '@/core/i18n/I18nContext';
import { panelCard } from '@/core/utils/tw';
import { Skeleton } from './SkeletonPrimitives';
import { SettingsHeroSkeleton } from './SettingsSkeletons';
import {
    ActivityListRowsSkeleton,
    PanelCardHeaderSkeleton
} from './SectionSkeletons';

export function HomeViewSkeleton() {
    const { t } = useTranslation();
    return (
        <div className="animate-fade-soft" aria-busy="true" aria-label={t.globals.loading.panel}>
            <SettingsHeroSkeleton />
            <div className="grid grid-cols-1 items-stretch gap-5 min-[1001px]:grid-cols-[1fr_310px]">
                <div className={`group/card ${panelCard} flex h-[510px] flex-col`}>
                    <PanelCardHeaderSkeleton withSubtitle trailing />
                    <div className="flex flex-wrap gap-2 border-b border-border-subtle px-5 py-3">
                        {[72, 88, 64, 80].map((w, i) => (
                            <Skeleton key={i} className="h-7 rounded-md" style={{ width: w }} />
                        ))}
                    </div>
                    <div className="min-h-0 flex-1 overflow-hidden px-5">
                        <ActivityListRowsSkeleton rows={5} />
                    </div>
                </div>

                <div className={`${panelCard} flex h-auto flex-col min-[1001px]:h-full`}>
                    <div className="flex shrink-0 items-center gap-3 border-b border-border-subtle px-5 py-3.5">
                        <Skeleton className="size-8 shrink-0 rounded-lg" />
                        <Skeleton className="h-3.5 w-24" />
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col gap-5 p-4">
                        {[32, 24].map((labelW, section) => (
                            <section key={section} className="flex flex-col">
                                <Skeleton
                                    className="mb-2 h-2.5"
                                    style={{ width: labelW }}
                                />
                                <div className="flex flex-col gap-1.5">
                                    {Array.from({ length: 3 }, (_, i) => (
                                        <div
                                            key={i}
                                            className="flex min-h-[44px] w-full items-center gap-2.5 rounded-lg border border-border-subtle bg-bg-secondary py-0 pl-1.5 pr-3"
                                        >
                                            <Skeleton className="size-8 shrink-0 rounded-lg" />
                                            <Skeleton
                                                className="h-3"
                                                style={{ width: `${4.5 + (i % 3)}rem` }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
