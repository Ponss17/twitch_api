import { forwardRef } from 'react';
import { AlertTriangle, Trash2, RotateCcw, ShieldAlert } from 'lucide-react';
import { card, fadeIn } from '@/core/ui/tw';

interface SettingsDangerZoneProps {
    visible: boolean;
    onClearData: () => void;
    onDeleteAccount: () => void;
}

export const SettingsDangerZone = forwardRef<HTMLDivElement, SettingsDangerZoneProps>(
    function SettingsDangerZone({ visible, onClearData, onDeleteAccount }, ref) {
        if (!visible) return null;

        return (
            <div
                ref={ref}
                id="danger-zone-section"
                className={`${card} ${fadeIn} mb-3 !border-error/30 opacity-0 [animation-delay:240ms] hover:!border-error/60`}
            >
                {/* Header */}
                <div className="mb-4 flex items-center gap-3 border-b border-error/15 pb-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-error/25 bg-error/10 text-error">
                        <ShieldAlert className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="mb-0.5 text-[0.95rem] font-bold text-error">Zona de Peligro</h3>
                        <p className="text-[0.8rem] text-[#c4c4cc]">
                            Acciones irreversibles — procede con precaución
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {/* Reiniciar Estadísticas */}
                    <div className="flex flex-col gap-4 rounded-xl border border-error/10 bg-error/[0.03] p-4 pl-5 transition-colors hover:border-error/25 hover:bg-error/[0.06] sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 text-[#fafafa]">
                            <h4 className="mb-1 text-[1.05rem] font-bold text-[#fafafa] flex items-center gap-2">
                                <RotateCcw className="h-4 w-4 text-error" />
                                Reiniciar Estadísticas
                            </h4>
                            <p className="m-0 max-w-[600px] text-[0.85rem] leading-relaxed text-zinc-400">
                                Borra todo el historial de comandos, clips, latencia y gráficas de analytics. Tu API Key seguirá activa.
                            </p>
                        </div>
                        <div className="shrink-0 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={onClearData}
                                className="inline-flex items-center gap-2 w-full sm:w-auto justify-center rounded-lg border border-error/20 bg-error/[0.06] px-5 py-2 text-sm font-bold text-error transition hover:border-error/40 hover:bg-error/[0.14] hover:text-error"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Limpiar Datos
                            </button>
                        </div>
                    </div>

                    {/* Eliminar Cuenta */}
                    <div className="flex flex-col gap-4 rounded-xl border border-error/10 bg-error/[0.03] p-4 pl-5 transition-colors hover:border-error/25 hover:bg-error/[0.06] sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 text-[#fafafa]">
                            <h4 className="mb-1 text-[1.05rem] font-bold text-[#fafafa] flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-error" />
                                Eliminar Cuenta
                            </h4>
                            <p className="m-0 max-w-[600px] text-[0.85rem] leading-relaxed text-zinc-400">
                                Borra permanentemente tu perfil y todos los datos asociados. <strong className="text-error/80">Esta acción es irreversible.</strong>
                            </p>
                        </div>
                        <div className="shrink-0 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={onDeleteAccount}
                                className="inline-flex items-center gap-2 w-full sm:w-auto justify-center rounded-lg bg-error/80 px-5 py-2 text-sm font-bold text-white transition hover:bg-error"
                            >
                                <Trash2 className="h-4 w-4" />
                                Eliminar Cuenta
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);
