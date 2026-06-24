import { forwardRef } from 'react';
import { AlertTriangle } from 'lucide-react';


interface ProfileDangerZoneProps {
    visible: boolean;
    onClearData: () => void;
    onDeleteAccount: () => void;
}

const dangerCardShell =
    'mb-3 scroll-mt-6 rounded-xl border border-[#ef4444]/30 bg-bg-card bg-gradient-to-br from-[#ef4444]/[0.03] to-transparent p-3 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-[border-color,box-shadow] duration-300 hover:border-[#ef4444] hover:shadow-[0_0_20px_rgba(239,68,68,0.1)] animate-[revealZone_1.1s_cubic-bezier(0.19,1,0.22,1)_forwards]';

export const ProfileDangerZone = forwardRef<HTMLDivElement, ProfileDangerZoneProps>(
    function ProfileDangerZone({ visible, onClearData, onDeleteAccount }, ref) {
        if (!visible) return null;

        return (
            <div ref={ref} id="danger-zone-section" className={dangerCardShell}>
            <div className="mb-2 flex items-center gap-3 border-b border-white/[0.08] pb-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#ef4444]/20 bg-[#ef4444]/10 text-[0.9rem] text-[#ef4444]">
                    <AlertTriangle />
                </div>
                <div>
                    <h3 className="mb-0.5 text-[0.95rem] font-bold text-[#ef4444]">Zona de Peligro</h3>
                    <p className="text-[0.8rem] text-[#a1a1aa]">
                        Acciones irreversibles sobre tus datos y cuenta
                    </p>
                </div>
            </div>

            <div className="grid gap-5 text-[#fafafa] [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
                <div className="flex flex-col justify-between gap-2.5 rounded-xl border border-white/[0.05] bg-black/20 p-3 transition hover:-translate-y-1 hover:border-[#ef4444]/30 hover:bg-[#ef4444]/[0.04]">
                    <div>
                        <h4 className="mb-2 text-base font-bold text-[#ef4444]">Reiniciar Estadísticas</h4>
                        <p className="m-0 text-[0.85rem] leading-normal text-[#a1a1aa]">
                            Borra todo el historial de comandos, clips y latencia. La API Key seguirá activa.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClearData}
                        className="mt-2 w-full cursor-pointer rounded-xl border border-[#ef4444]/40 bg-transparent px-3 py-3 text-[0.9rem] font-semibold text-[#ef4444] transition hover:border-[#ef4444] hover:bg-[#ef4444] hover:text-white hover:shadow-[0_4px_15px_rgba(239,68,68,0.2)]"
                    >
                        Limpiar Datos
                    </button>
                </div>

                <div className="flex flex-col justify-between gap-2.5 rounded-xl border border-white/[0.05] bg-black/20 p-3 transition hover:-translate-y-1 hover:border-[#ef4444]/30 hover:bg-[#ef4444]/[0.04]">
                    <div>
                        <h4 className="mb-2 text-base font-bold text-[#ef4444]">Eliminar Acceso API</h4>
                        <p className="m-0 text-[0.85rem] leading-normal text-[#a1a1aa]">
                            Borra permanentemente tu perfil en LosPerris API y todos los datos asociados.{' '}
                            <strong className="text-[#fafafa]">Tu cuenta de Twitch seguirá intacta.</strong>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onDeleteAccount}
                        className="mt-2 w-full cursor-pointer rounded-xl border border-[#ef4444] bg-[#ef4444] px-3 py-3 text-[0.9rem] font-bold text-white transition hover:border-[#dc2626] hover:bg-[#dc2626]"
                    >
                        Eliminar Perfil
                    </button>
                </div>
            </div>
        </div>
    );
    }
);
