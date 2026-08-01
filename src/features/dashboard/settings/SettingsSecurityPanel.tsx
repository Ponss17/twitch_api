import { SettingsGroup } from '@/features/dashboard/settings/SettingsGroup';
import { SettingsSecuritySection } from '@/features/dashboard/settings/SettingsSecuritySection';
import { SettingsDangerZone } from '@/features/dashboard/settings/SettingsDangerZone';
import { useTranslation } from '@/core/i18n/I18nContext';

interface SettingsSecurityPanelProps {
    apiKey: string;
    keyVisible: boolean;
    onToggleKey: () => void;
    onCopyKey: () => void;
    onRegenKey: () => void;
    onClearData: () => void;
    onDeleteAccount: () => void;
}

export function SettingsSecurityPanel({
    apiKey,
    keyVisible,
    onToggleKey,
    onCopyKey,
    onRegenKey,
    onClearData,
    onDeleteAccount
}: SettingsSecurityPanelProps) {
    const { t } = useTranslation();
    const gT = t.settings.groups;

    return (
        <>
            <SettingsGroup
                title={gT.security.title}
                description={gT.security.desc}
                delay={40}
            >
                <SettingsSecuritySection
                    apiKey={apiKey}
                    keyVisible={keyVisible}
                    onToggleKey={onToggleKey}
                    onCopyKey={onCopyKey}
                    onRegenKey={onRegenKey}
                />
            </SettingsGroup>

            <SettingsDangerZone
                onClearData={onClearData}
                onDeleteAccount={onDeleteAccount}
            />
        </>
    );
}
