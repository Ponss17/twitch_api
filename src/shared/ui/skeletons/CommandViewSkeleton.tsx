import { useTranslation } from '@/core/i18n/I18nContext';
import { panelCard } from '@/core/utils/tw';
import { Skeleton } from './SkeletonPrimitives';
import { PanelCardHeaderSkeleton } from './SectionSkeletons';

/** Dos cards apiladas como CommandGeneratorCard + ApiTestCard. */
export function CommandViewSkeleton() {
    const { t } = useTranslation();
    return (
        <div className="animate-fade-soft w-full" aria-busy="true" aria-label={t.globals.loading.commands}>
            <div className={`${panelCard} relative z-10 mb-5 flex flex-col`}>
                <PanelCardHeaderSkeleton withSubtitle trailing />
                <div className="space-y-2.5 p-5">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                        >
                            <Skeleton className="h-3.5 w-28" />
                            <Skeleton className="h-9 w-full rounded-lg sm:max-w-[16rem]" />
                        </div>
                    ))}
                    <Skeleton className="mt-3 h-11 w-full rounded-lg" />
                    <Skeleton className="h-9 w-36 rounded-lg" />
                </div>
            </div>

            <div className={`${panelCard} mb-5 flex flex-col`}>
                <PanelCardHeaderSkeleton withSubtitle trailing />
                <div className="p-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Skeleton className="h-10 w-full rounded-lg" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                    <Skeleton className="mt-4 h-10 w-32 rounded-lg" />
                </div>
            </div>
        </div>
    );
}
