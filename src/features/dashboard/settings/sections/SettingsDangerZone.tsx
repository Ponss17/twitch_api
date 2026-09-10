import { AlertTriangle, LogOut } from 'lucide-react';
import { SettingsGroup, SettingsRow } from '@/features/dashboard/settings/components/SettingsGroup';
import { useTranslation } from '@/core/i18n/I18nContext';
import { btnSecondary } from '@/core/utils/tw';

interface SettingsDangerZoneProps {
    onRevokeSessions: () => void;
    onDeleteAccount: () => void;
}

const revokeBtn = `${btnSecondary} w-full min-w-[7.5rem] px-3.5 sm:w-auto`;
const deleteBtn =
    'inline-flex w-full min-w-[7.5rem] items-center justify-center gap-1.5 rounded-lg border border-error/45 bg-error/10 px-3.5 py-2 text-[0.8125rem] font-semibold text-error transition hover:bg-error/15 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto';

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
                    <button type="button" onClick={onRevokeSessions} className={revokeBtn}>
                        {pT.revokeSessionsAction}
                    </button>
                }
            />
            <SettingsRow
                icon={AlertTriangle}
                title={pT.deleteAccount}
                description={pT.deleteAccountDesc}
                control={
                    <button type="button" onClick={onDeleteAccount} className={deleteBtn}>
                        {pT.deleteAccountAction}
                    </button>
                }
            />
        </SettingsGroup>
    );
}
