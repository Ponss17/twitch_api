import { useTranslation } from '@/core/i18n/I18nContext';
import { panelCard } from '@/core/utils/tw';
import { Skeleton } from './SkeletonPrimitives';
import { StalkerRowSkeleton } from './StalkerRowSkeleton';
import { ToolPanelHeaderSkeleton } from './SectionSkeletons';

export function StalkerViewSkeleton() {
    const { t } = useTranslation();
    return (
        <div
            className={`${panelCard} mb-3 flex animate-fade-soft flex-col`}
            aria-busy="true"
            aria-label={t.globals.loading.stalker}
        >
            <ToolPanelHeaderSkeleton withConfigBar />
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-border-subtle bg-bg-secondary text-text-muted">
                            <th className="px-5 py-3">
                                <Skeleton className="h-3 w-12" />
                            </th>
                            <th className="px-5 py-3">
                                <Skeleton className="h-3 w-16" />
                            </th>
                            <th className="px-5 py-3">
                                <Skeleton className="h-3 w-20" />
                            </th>
                            <th className="px-5 py-3">
                                <Skeleton className="ml-auto h-3 w-12" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <StalkerRowSkeleton key={i} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
