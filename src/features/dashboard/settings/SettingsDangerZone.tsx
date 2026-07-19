import { forwardRef, type ReactNode } from 'react';
import { AlertTriangle, Trash2, RotateCcw, type LucideIcon } from 'lucide-react';
import { SettingsGroup } from '@/features/dashboard/settings/SettingsGroup';
import { subtleIcon } from '@/features/dashboard/lib/subtleAccents';

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
                    <h4 className="text-[0.9rem] font-semibold text-[#fafafa]">{title}</h4>
                    <p className="mt-0.5 max-w-xl text-[0.8rem] leading-relaxed text-[#8b8b93]">
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
export const SettingsDangerZone = forwardRef<HTMLDivElement, SettingsDangerZoneProps>(
    function SettingsDangerZone({ onClearData, onDeleteAccount }, ref) {
        return (
            <SettingsGroup
                ref={ref}
                title="Zona de Peligro"
                description="Acciones irreversibles — procede con precaución"
                accent="error"
                delay={120}
            >
                <div className="overflow-hidden rounded-xl border border-error/20 bg-error/[0.04]">
                    <DangerAction
                        icon={RotateCcw}
                        title="Reiniciar Estadísticas"
                        description="Borra el historial de comandos, clips, latencia y gráficas. Tu API Key sigue activa."
                        control={
                            <button
                                type="button"
                                onClick={onClearData}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-error/25 bg-error/[0.06] px-5 py-2 text-sm font-bold text-error transition hover:border-error/45 hover:bg-error/[0.14] sm:w-auto"
                            >
                                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                                Limpiar Datos
                            </button>
                        }
                    />

                    <div className="mx-4 border-t border-error/15" role="separator" />

                    <DangerAction
                        icon={AlertTriangle}
                        title="Eliminar Cuenta"
                        description={
                            <>
                                Borra permanentemente tu perfil y todos los datos asociados.{' '}
                                <strong className="text-error/80">Irreversible.</strong> No afecta a tu
                                canal de Twitch.
                            </>
                        }
                        control={
                            <button
                                type="button"
                                onClick={onDeleteAccount}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-error/80 px-5 py-2 text-sm font-bold text-white transition hover:bg-error sm:w-auto"
                            >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                                Eliminar Cuenta
                            </button>
                        }
                    />
                </div>
            </SettingsGroup>
        );
    }
);
