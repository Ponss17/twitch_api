import { AlertTriangle, RotateCcw } from 'lucide-react';
import { SettingsGroup, SettingsRow } from '@/features/dashboard/settings/SettingsGroup';
import { useTranslation } from '@/core/i18n/I18nContext';
import { btnSecondary } from '@/core/utils/tw';

interface SettingsDangerZoneProps {
    onClearData: () => void;
    onDeleteAccount: () => void;
}

/** Un solo bloque: reiniciar datos + eliminar cuenta. */
export function SettingsDangerZone({ onClearData, onDeleteAccount }: SettingsDangerZoneProps) {
    const { t } = useTranslation();
    const gT = t.settings.groups;
    const pT = t.settings.panels;

    return (
        <SettingsGroup title={gT.dangerZone.title} description={gT.dangerZone.desc} delay={120}>
            <SettingsRow
                icon={RotateCcw}
                title={pT.resetStats}
                description={pT.resetStatsDesc}
                control={
                    <button
                        type="button"
                        onClick={onClearData}
                        className={`${btnSecondary} w-full min-w-[12.25rem] sm:w-auto`}
                    >
                        {pT.resetStats}
                    </button>
                }
            />
            <SettingsRow
                icon={AlertTriangle}
                title={pT.deleteAccount}
                description={pT.deleteAccountDesc}
                control={
                    <button
                        type="button"
                        onClick={onDeleteAccount}
                        className={`${btnSecondary} w-full min-w-[12.25rem] sm:w-auto`}
                    >
                        {pT.deleteAccount}
                    </button>
                }
            />
        </SettingsGroup>
    );
}
