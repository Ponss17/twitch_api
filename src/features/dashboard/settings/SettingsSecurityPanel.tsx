import { SettingsGroup } from '@/features/dashboard/settings/SettingsGroup';
import { SettingsSecuritySection } from '@/features/dashboard/settings/SettingsSecuritySection';
import { SettingsDangerZone } from '@/features/dashboard/settings/SettingsDangerZone';

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
    return (
        <>
            <SettingsGroup
                title="Seguridad"
                description="Credenciales privadas de tu cuenta"
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
