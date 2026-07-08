import { Download, Loader2 } from 'lucide-react';
import { card, fadeIn } from '@/core/ui/tw';

interface ProfileExportSectionProps {
    onExport: () => void | Promise<void>;
    loading?: boolean;
}

const cardShell = `${card} ${fadeIn} mb-3 opacity-0`;

export function ProfileExportSection({ onExport, loading = false }: ProfileExportSectionProps) {
    return (
        <div className={`${cardShell} [animation-delay:180ms]`}>
            <div className="mb-2 flex items-center gap-3 border-b border-white/[0.08] pb-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                    <Download className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="mb-0.5 text-[0.95rem] font-bold">Tus Datos</h3>
                    <p className="text-[0.8rem] text-[#c4c4cc]">
                        Descarga toda tu información en un documento legible
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-black/20 p-4 pl-5 transition-colors hover:bg-black/30 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 text-[#fafafa]">
                    <h4 className="mb-1 text-[1.05rem] font-bold text-white">Reporte de Cuenta Completo</h4>
                    <p className="m-0 max-w-[600px] text-[0.85rem] leading-relaxed text-[#c4c4cc]">
                        Genera un archivo HTML estático con toda la información de tu perfil, historial de
                        comandos y credenciales, listo para visualizar offline.
                    </p>
                </div>
                <div className="shrink-0 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={() => void onExport()}
                        disabled={loading}
                        className="inline-flex items-center gap-2 w-full sm:w-auto justify-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {loading ? 'Generando...' : 'Generar Reporte'}
                    </button>
                </div>
            </div>
        </div>
    );
}
