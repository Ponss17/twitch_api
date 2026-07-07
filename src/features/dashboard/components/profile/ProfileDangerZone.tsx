import { forwardRef } from 'react';

interface ProfileDangerZoneProps {
    visible: boolean;
    onClearData: () => void;
    onDeleteAccount: () => void;
}

const dangerCardShell =
    'mb-3 scroll-mt-6 rounded-xl border border-error/20 bg-error/[0.02] p-5 animate-[revealZone_1.1s_cubic-bezier(0.19,1,0.22,1)_forwards]';

export const ProfileDangerZone = forwardRef<HTMLDivElement, ProfileDangerZoneProps>(
    function ProfileDangerZone({ visible, onClearData, onDeleteAccount }, ref) {
        if (!visible) return null;

        return (
            <div ref={ref} id="danger-zone-section" className={dangerCardShell}>
                <h3 className="mb-4 text-lg font-bold text-error">Danger Zone</h3>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-error/10 bg-error/[0.04] p-4 transition-colors hover:border-error/30 hover:bg-error/[0.08]">
                        <div>
                            <h4 className="mb-1 text-base font-bold text-error">Reiniciar Estadísticas</h4>
                            <p className="m-0 text-[0.85rem] text-error/80">
                                Borra todo el historial de comandos, clips y latencia. La API Key seguirá activa.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClearData}
                            className="shrink-0 rounded-lg border border-error/40 bg-transparent px-4 py-2 text-[0.85rem] font-bold text-error transition hover:border-error hover:bg-error hover:text-white"
                        >
                            Limpiar Datos
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-error/30 bg-error/10 p-4 transition-colors hover:bg-error/20">
                        <div>
                            <h4 className="mb-1 text-base font-bold text-error">Eliminar Cuenta</h4>
                            <p className="m-0 text-[0.85rem] text-error/80">
                                Borra permanentemente tu perfil y todos los datos asociados.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onDeleteAccount}
                            className="shrink-0 rounded-lg bg-error px-4 py-2 text-[0.85rem] font-bold text-white transition hover:bg-error-hover"
                        >
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        );
    }
);
