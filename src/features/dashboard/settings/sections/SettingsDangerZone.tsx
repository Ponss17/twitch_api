import { AlertTriangle, LogOut } from 'lucide-react';
import { SettingsGroup, SettingsRow } from '@/features/dashboard/settings/components/SettingsGroup';
import { useTranslation } from '@/core/i18n/I18nContext';
import { btnSecondary } from '@/core/utils/tw';

interface SettingsDangerZoneProps {
    onRevokeSessions: () => void;
    onDeleteAccount: () => void;
}

const actionBtn = `${btnSecondary} w-full min-w-[7.5rem] px-3.5 sm:w-auto`;

/** Cerrar sesiones + eliminar cuenta. */
export function SettingsDangerZone({ onRevokeSessions, onDeleteAccount }: SettingsDangerZoneProps) {
    const { t } = useTranslation();
    const gT = t.settings.groups;
    const pT = t.settings.panels;

    return (
        <SettingsGroup title={gT.dangerZone.title} description={gT.dangerZone.desc} delay={120}>
            <SettingsRow
                icon={LogOut}
                title={pT.revokeSessions}
                description={pT.revokeSessionsDesc}
                control={
                    <button type="button" onClick={onRevokeSessions} className={actionBtn}>
                        {pT.revokeSessionsAction}
                    </button>
                }
            />
            <SettingsRow
                icon={AlertTriangle}
                title={pT.deleteAccount}
                description={pT.deleteAccountDesc}
                control={
                    <button type="button" onClick={onDeleteAccount} className={actionBtn}>
                        {pT.deleteAccountAction}
                    </button>
                }
            />
        </SettingsGroup>
    );
}
