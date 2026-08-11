import { useTranslation } from '@/core/i18n/I18nContext';
import { Skeleton } from './SkeletonPrimitives';

export function CommandViewSkeleton() {
    const { t } = useTranslation();
    return (
        <div className="animate-fade-soft w-full" aria-busy="true" aria-label={t.globals.loading.commands}>
            <div className="mb-3 flex flex-col rounded-xl border border-border-subtle bg-bg-card">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-lg bg-transparent border border-border-subtle" />
                        <div className="space-y-1.5">
                            <Skeleton className="h-4 w-32 bg-transparent" />
                            <Skeleton className="h-3 w-48 bg-transparent" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-24 rounded-lg bg-transparent border border-border-subtle" />
                </header>
                <div className="p-5 space-y-4">
                    <Skeleton className="h-10 w-full rounded-lg bg-bg-card border border-border-subtle" />
                    <Skeleton className="h-32 w-full rounded-lg bg-bg-card border border-border-subtle" />
                </div>
            </div>
        </div>
    );
}
