import { Download, Loader2 } from 'lucide-react';

import { card, fadeIn } from '@/lib/tw';

interface ProfileExportSectionProps {
    onExport: () => void | Promise<void>;
    loading?: boolean;
}

const cardShell = `${card} ${fadeIn} mb-3 opacity-0`;

export function ProfileExportSection({ onExport, loading = false }: ProfileExportSectionProps) {
    return (
        <div className={`${cardShell} [animation-delay:180ms]`}>
            <div className="mb-2 flex items-center gap-3 border-b border-white/[0.08] pb-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-[0.9rem] text-primary">
                    <Download />
                </div>
                <div>
                    <h3 className="mb-0.5 text-[0.95rem] font-bold">Tus Datos</h3>
                    <p className="text-[0.8rem] text-[#a1a1aa]">
                        Descarga toda tu información en un documento legible
                    </p>
                </div>
            </div>

            <div className="relative flex items-center justify-between gap-4 overflow-hidden rounded-xl border border-primary/15 bg-black/25 p-4 pl-5 backdrop-blur-[10px] transition hover:bg-primary/[0.03] hover:shadow-[0_0_20px_rgba(145,70,255,0.08)] before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-primary before:to-transparent before:opacity-60 max-md:flex-col max-md:text-center">
                <div className="flex-1 text-[#fafafa]">
                    <h4 className="mb-2 text-[1.15rem] font-bold text-white">Reporte de Cuenta Completo</h4>
                    <p className="m-0 max-w-[600px] text-[0.9rem] leading-normal text-[#a1a1aa] max-md:mx-auto">
                        Genera un archivo HTML estático con toda la información de tu perfil, historial de
                        comandos y credenciales, listo para visualizar offline.
                    </p>
                </div>
                <div className="shrink-0 max-md:w-full">
                    <button
                        type="button"
                        onClick={() => void onExport()}
                        disabled={loading}
                        className="inline-flex items-center gap-2.5 whitespace-nowrap rounded-lg bg-primary px-7 py-3 text-base font-semibold text-white shadow-[0_4px_12px_rgba(145,70,255,0.3)] transition hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-[0_6px_20px_rgba(145,70,255,0.3)] disabled:cursor-not-allowed disabled:opacity-60 max-md:w-full max-md:justify-center"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Download />}
                        {loading ? 'Generando...' : 'Generar Reporte'}
                    </button>
                </div>
            </div>
        </div>
    );
}
