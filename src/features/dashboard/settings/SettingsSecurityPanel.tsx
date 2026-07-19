import type { Ref } from 'react';
import { SettingsGroup } from '@/features/dashboard/settings/SettingsGroup';
import { SettingsSecuritySection } from '@/features/dashboard/settings/SettingsSecuritySection';
import { SettingsDangerZone } from '@/features/dashboard/settings/SettingsDangerZone';

interface SettingsSecurityPanelProps {
    apiKey: string;
    keyVisible: boolean;
    onToggleKey: () => void;
    onCopyKey: () => void;
    onRegenKey: () => void;
    onFocusDanger: () => void;
    dangerZoneRef: Ref<HTMLDivElement>;
    onClearData: () => void;
    onDeleteAccount: () => void;
}

export function SettingsSecurityPanel({
    apiKey,
    keyVisible,
    onToggleKey,
    onCopyKey,
    onRegenKey,
    onFocusDanger,
    dangerZoneRef,
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
                    onFocusDanger={onFocusDanger}
                />
            </SettingsGroup>

            <SettingsDangerZone
                ref={dangerZoneRef}
                onClearData={onClearData}
                onDeleteAccount={onDeleteAccount}
            />
        </>
    );
}
