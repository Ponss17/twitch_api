import { AlertTriangle, Trash2, RotateCcw } from 'lucide-react';
import { SettingsGroup, SettingsRow } from '@/features/dashboard/settings/SettingsGroup';
import { useTranslation } from '@/core/i18n/I18nContext';
import { btnDanger } from '@/core/utils/tw';

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
        <SettingsGroup
            title={gT.dangerZone.title}
            description={gT.dangerZone.desc}
            accent="error"
            delay={120}
        >
            <SettingsRow
                accent="error"
                icon={RotateCcw}
                title={pT.resetStats}
                description={pT.resetStatsDesc}
                control={
                    <button
                        type="button"
                        onClick={onClearData}
                        className={`${btnDanger} w-full sm:w-auto px-5 py-2 !shadow-none`}
                    >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        {pT.resetStats}
                    </button>
                }
            />
            <SettingsRow
                accent="error"
                icon={AlertTriangle}
                title={pT.deleteAccount}
                description={pT.deleteAccountDesc}
                control={
                    <button
                        type="button"
                        onClick={onDeleteAccount}
                        className={`${btnDanger} w-full sm:w-auto px-5 py-2 !shadow-none`}
                    >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        {pT.deleteAccount}
                    </button>
                }
            />
        </SettingsGroup>
    );
}
