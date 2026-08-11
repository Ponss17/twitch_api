import { useTranslation } from '@/core/i18n/I18nContext';
import { Skeleton } from './SkeletonPrimitives';
import { StalkerRowSkeleton } from './StalkerRowSkeleton';

export function StalkerViewSkeleton() {
    const { t } = useTranslation();
    return (
        <div className="animate-fade-soft w-full" aria-busy="true" aria-label={t.globals.loading.stalker}>
            <div className="mb-3 flex flex-col rounded-xl border border-border-subtle bg-bg-card">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-lg bg-transparent border border-border-subtle" />
                        <div className="space-y-1.5">
                            <Skeleton className="h-4 w-40 bg-transparent" />
                            <Skeleton className="h-3 w-56 bg-transparent" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-48 rounded-lg bg-transparent border border-border-subtle" />
                </header>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border-subtle bg-bg-secondary text-text-muted">
                                <th className="px-5 py-3"><Skeleton className="h-3 w-12 bg-transparent" /></th>
                                <th className="px-5 py-3"><Skeleton className="h-3 w-16 bg-transparent" /></th>
                                <th className="px-5 py-3"><Skeleton className="h-3 w-20 bg-transparent" /></th>
                                <th className="px-5 py-3"><Skeleton className="ml-auto h-3 w-12 bg-transparent" /></th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 8 }).map((_, i) => <StalkerRowSkeleton key={i} />)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
