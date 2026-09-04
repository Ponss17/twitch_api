import { SettingsGroup } from '@/features/dashboard/settings/components/SettingsGroup';
import { SettingsSecuritySection } from '@/features/dashboard/settings/sections/SettingsSecuritySection';
import { SettingsAuditLogs } from '@/features/dashboard/settings/sections/SettingsAuditLogs';
import { SettingsDangerZone } from '@/features/dashboard/settings/sections/SettingsDangerZone';
import { useTranslation } from '@/core/i18n/I18nContext';

interface SettingsSecurityPanelProps {
    apiKey: string;
    keyVisible: boolean;
    accountId?: string;
    onToggleKey: () => void;
    onCopyKey: () => void;
    onRegenKey: () => void;
    onCopyAccountId?: () => void;
    onClearData: () => void;
    onDeleteAccount: () => void;
    auditActive: boolean;
    auditEpoch: number;
    timezone?: string;
}

export function SettingsSecurityPanel({
    apiKey,
    keyVisible,
    accountId,
    onToggleKey,
    onCopyKey,
    onRegenKey,
    onCopyAccountId,
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
                    accountId={accountId}
                    onToggleKey={onToggleKey}
                    onCopyKey={onCopyKey}
                    onRegenKey={onRegenKey}
                    onCopyAccountId={onCopyAccountId}
                />
                <SettingsAuditLogs
                    active={auditActive}
                    refreshEpoch={auditEpoch}
                    timezone={timezone}
                    accountId={accountId}
                    onCopyAccountId={onCopyAccountId}
                />
            </SettingsGroup>

            <SettingsDangerZone
                onClearData={onClearData}
                onDeleteAccount={onDeleteAccount}
            />
        </>
    );
}
