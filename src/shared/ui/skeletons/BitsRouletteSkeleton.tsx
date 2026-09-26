import { useTranslation } from '@/core/i18n/I18nContext';
import { fadeIn, panelCard } from '@/core/utils/tw';
import { Skeleton } from './SkeletonPrimitives';
import { ToolPanelHeaderSkeleton } from './SectionSkeletons';

export function BitsRouletteSkeleton() {
    const { t } = useTranslation();
    return (
        <div
            className={`${panelCard} ${fadeIn} mb-3 flex flex-col`}
            aria-busy="true"
            aria-label={t.globals.loading.bitsRoulette}
        >
            <ToolPanelHeaderSkeleton withConfigBar />
            <div className="flex flex-col gap-4 p-5">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-8 w-full rounded-lg" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-[7.5rem] w-full rounded-lg" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-32 rounded-lg" />
                    <Skeleton className="h-9 w-36 rounded-lg" />
                </div>
            </div>
        </div>
    );
}
