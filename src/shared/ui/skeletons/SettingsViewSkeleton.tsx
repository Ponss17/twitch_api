import { useTranslation } from '@/core/i18n/I18nContext';
import { Skeleton } from './SkeletonPrimitives';
import { SettingsTabsSkeleton } from './SettingsSkeletons';

export function SettingsViewSkeleton() {
    const { t } = useTranslation();
    return (
        <div className="animate-fade-soft" aria-busy="true" aria-label={t.globals.loading.settings}>
            <SettingsTabsSkeleton />
            <div className="mt-2 space-y-4">
                <Skeleton className="h-[200px] w-full rounded-xl border border-border-subtle bg-bg-card" />
            </div>
        </div>
    );
}
