import { type ReactNode } from 'react';
import { AlertTriangle, Trash2, RotateCcw, type LucideIcon } from 'lucide-react';
import { SettingsGroup } from '@/features/dashboard/settings/SettingsGroup';
import { subtleIcon } from '@/features/dashboard/lib/subtleAccents';
import { useTranslation } from '@/core/i18n/I18nContext';
import { btnDanger } from '@/core/utils/tw';

interface SettingsDangerZoneProps {
    onClearData: () => void;
    onDeleteAccount: () => void;
}

function DangerAction({
    icon: Icon,
    title,
    description,
    control
}: {
    icon: LucideIcon;
    title: string;
    description: ReactNode;
    control: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex min-w-0 flex-1 items-start gap-3">
                <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${subtleIcon('error')}`}
                >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 pt-0.5">
                    <h3 className="text-[0.9rem] font-semibold text-text-main">{title}</h3>
                    <p className="mt-0.5 max-w-xl text-[0.8rem] leading-relaxed text-text-muted">
                        {description}
                    </p>
                </div>
            </div>
            <div className="flex w-full shrink-0 items-center justify-end sm:w-auto sm:pl-2">
                {control}
            </div>
        </div>
    );
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
                <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-card">
                    <DangerAction
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

                    <div className="mx-4 border-t border-border-subtle" role="separator" />

                    <DangerAction
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
                </div>
            </SettingsGroup>
    );
}
