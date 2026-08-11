import { useTranslation } from '@/core/i18n/I18nContext';
import { Skeleton } from './SkeletonPrimitives';
import { SettingsHeroSkeleton } from './SettingsSkeletons';

export function SettingsViewSkeleton() {
    const { t } = useTranslation();
    return (
        <div className="animate-fade-soft space-y-6" aria-busy="true" aria-label={t.globals.loading.settings}>
            <SettingsHeroSkeleton />
            <div className="mb-6 border-b border-border-subtle">
                <div className="flex gap-6 pb-2">
                    <Skeleton className="h-8 w-24 bg-transparent" />
                    <Skeleton className="h-8 w-32 bg-transparent" />
                    <Skeleton className="h-8 w-32 bg-transparent" />
                </div>
            </div>
            <div className="space-y-4">
                <Skeleton className="h-[200px] w-full rounded-xl bg-bg-card border border-border-subtle" />
                <Skeleton className="h-[200px] w-full rounded-xl bg-bg-card border border-border-subtle" />
            </div>
        </div>
    );
}
