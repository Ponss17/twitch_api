import { forwardRef } from 'react';
import { AlertTriangle, Trash2, RotateCcw, ShieldAlert } from 'lucide-react';
import { card, fadeIn } from '@/core/ui/tw';

interface ProfileDangerZoneProps {
    visible: boolean;
    onClearData: () => void;
    onDeleteAccount: () => void;
}

export const ProfileDangerZone = forwardRef<HTMLDivElement, ProfileDangerZoneProps>(
    function ProfileDangerZone({ visible, onClearData, onDeleteAccount }, ref) {
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
                    <div className="flex flex-col gap-4 rounded-xl border border-white/[0.06] bg-black/20 p-4 pl-5 transition-colors hover:bg-black/30 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/15 bg-amber-500/[0.08]">
                                <RotateCcw className="h-4 w-4 text-amber-400" />
                            </div>
                            <div>
                                <h4 className="mb-0.5 text-[0.9rem] font-bold text-[#fafafa]">
                                    Reiniciar Estadísticas
                                </h4>
                                <p className="m-0 max-w-[460px] text-[0.82rem] leading-relaxed text-zinc-400">
                                    Borra todo el historial de comandos, clips y latencia.
                                    <span className="ml-1 text-zinc-300">Tu API Key seguirá activa.</span>
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClearData}
                            className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-2 text-[0.82rem] font-bold text-amber-400 transition hover:border-amber-500/40 hover:bg-amber-500/[0.14] hover:text-amber-300 sm:w-auto w-full justify-center"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Limpiar Datos
                        </button>
                    </div>

                    {/* Eliminar Cuenta */}
                    <div className="flex flex-col gap-4 rounded-xl border border-error/10 bg-error/[0.03] p-4 pl-5 transition-colors hover:border-error/25 hover:bg-error/[0.06] sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-error/20 bg-error/[0.08]">
                                <AlertTriangle className="h-4 w-4 text-error" />
                            </div>
                            <div>
                                <h4 className="mb-0.5 text-[0.9rem] font-bold text-[#fafafa]">
                                    Eliminar Cuenta
                                </h4>
                                <p className="m-0 max-w-[460px] text-[0.82rem] leading-relaxed text-zinc-400">
                                    Borra permanentemente tu perfil y todos los datos asociados.
                                    <span className="ml-1 font-semibold text-error/80">Esta acción es irreversible.</span>
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onDeleteAccount}
                            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-error/80 px-4 py-2 text-[0.82rem] font-bold text-white transition hover:bg-error sm:w-auto w-full justify-center"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar Cuenta
                        </button>
                    </div>
                </div>
            </div>
        );
    }
);
