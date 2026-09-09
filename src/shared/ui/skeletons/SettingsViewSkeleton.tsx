import { useTranslation } from '@/core/i18n/I18nContext';
import { SettingsTabsSkeleton } from './SettingsSkeletons';

export function SettingsViewSkeleton() {
    const { t } = useTranslation();
    return (
        <div className="animate-fade-soft w-full" aria-busy="true" aria-label={t.globals.loading.settings}>
            <SettingsTabsSkeleton />
        </div>
    );
}
