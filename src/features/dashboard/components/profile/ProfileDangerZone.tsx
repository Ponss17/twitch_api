import { forwardRef } from 'react';

interface ProfileDangerZoneProps {
    visible: boolean;
    onClearData: () => void;
    onDeleteAccount: () => void;
}

const dangerCardShell =
    'mb-3 scroll-mt-6 rounded-xl border border-error/50 bg-transparent p-5 animate-[revealZone_1.1s_cubic-bezier(0.19,1,0.22,1)_forwards]';

export const ProfileDangerZone = forwardRef<HTMLDivElement, ProfileDangerZoneProps>(
    function ProfileDangerZone({ visible, onClearData, onDeleteAccount }, ref) {
        if (!visible) return null;

        return (
            <div ref={ref} id="danger-zone-section" className={dangerCardShell}>
                <h3 className="mb-4 text-lg font-bold text-error">Danger Zone</h3>

                <div className="flex flex-col">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] py-4 transition-colors">
                        <div>
                            <h4 className="mb-1 text-base font-bold text-[#fafafa]">Reiniciar Estadísticas</h4>
                            <p className="m-0 text-[0.85rem] text-zinc-400">
                                Borra todo el historial de comandos, clips y latencia. La API Key seguirá activa.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClearData}
                            className="shrink-0 rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-[0.85rem] font-bold text-error transition hover:border-error hover:bg-error/10"
                        >
                            Limpiar Datos
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 transition-colors">
                        <div>
                            <h4 className="mb-1 text-base font-bold text-[#fafafa]">Eliminar Cuenta</h4>
                            <p className="m-0 text-[0.85rem] text-zinc-400">
                                Borra permanentemente tu perfil y todos los datos asociados. Esta acción es irreversible.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onDeleteAccount}
                            className="shrink-0 rounded-lg bg-error/90 px-4 py-2 text-[0.85rem] font-bold text-white transition hover:bg-error"
                        >
                            Eliminar Cuenta
                        </button>
                    </div>
                </div>
            </div>
        );
    }
);
