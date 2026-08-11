import { useTranslation } from '@/core/i18n/I18nContext';
import { Skeleton } from './SkeletonPrimitives';

export function ClipsGridSkeleton({ count = 6, className = '' }: { count?: number; className?: string }) {
    const { t } = useTranslation();
    return (
        <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 ${className}`.trim()}
            aria-busy="true"
            aria-label={t.globals.loading.clips}
        >
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border-subtle bg-bg-secondary">
                    <Skeleton className="aspect-video w-full rounded-none" />
                    <div className="space-y-2 p-3">
                        <Skeleton className="h-4 w-4/5" />
                        <div className="flex justify-between gap-2">
                            <Skeleton className="h-3 w-[30%]" />
                            <Skeleton className="h-3 w-[30%]" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
