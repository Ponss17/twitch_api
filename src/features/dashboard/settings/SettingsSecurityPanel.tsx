import { SettingsGroup } from '@/features/dashboard/settings/SettingsGroup';
import { SettingsSecuritySection } from '@/features/dashboard/settings/SettingsSecuritySection';
import { SettingsAuditLogs } from '@/features/dashboard/settings/SettingsAuditLogs';
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
    auditActive: boolean;
    auditEpoch: number;
    timezone?: string;
}

export function SettingsSecurityPanel({
    apiKey,
    keyVisible,
    onToggleKey,
    onCopyKey,
    onRegenKey,
    onClearData,
    onDeleteAccount,
    auditActive,
    auditEpoch,
    timezone
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
                <SettingsAuditLogs active={auditActive} refreshEpoch={auditEpoch} timezone={timezone} />
            </SettingsGroup>

            <SettingsDangerZone
                onClearData={onClearData}
                onDeleteAccount={onDeleteAccount}
            />
        </>
    );
}
