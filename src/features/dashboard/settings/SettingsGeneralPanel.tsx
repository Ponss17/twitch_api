import type { DashboardProfile } from '@/features/dashboard/lib/dashboardSummary';
import { SettingsGroup } from '@/features/dashboard/settings/SettingsGroup';
import { SettingsAccountSection } from '@/features/dashboard/settings/SettingsAccountSection';
import { SettingsPreferencesSection } from '@/features/dashboard/settings/SettingsPreferencesSection';
import { useTranslation } from '@/core/i18n/I18nContext';

interface SettingsGeneralPanelProps {
    userId?: string;
    profile: DashboardProfile | null;
    onCopyId: () => void;
    onPreferencesChanged: () => void;
}

export function SettingsGeneralPanel({
    userId,
    profile,
    onCopyId,
    onPreferencesChanged
}: SettingsGeneralPanelProps) {
    const { t } = useTranslation();
    const gT = t.settings.groups;

    return (
        <>
            <SettingsGroup title={gT.account.title} description={gT.account.desc} delay={40}>
                <SettingsAccountSection
                    userId={userId}
                    rateLimit={profile?.rateLimit ?? 60}
                    heavyLimit={profile?.heavyLimit}
                    cacheTtl={profile?.cacheTtl ?? 60}
                    roleLabel={profile?.roleLabel ?? 'Default'}
                    hasCustomRateLimit={profile?.hasCustomRateLimit}
                    hasCustomCacheTtl={profile?.hasCustomCacheTtl}
                    onCopyId={onCopyId}
                />
            </SettingsGroup>

            <SettingsGroup title={gT.preferences.title} description={gT.preferences.desc} delay={60}>
                <SettingsPreferencesSection
                    currentTimezone={profile?.timezone || 'UTC'}
                    onSettingsChanged={onPreferencesChanged}
                />
            </SettingsGroup>
        </>
    );
}
