import { Download, Loader2 } from 'lucide-react';
import { SettingsRow } from '@/features/dashboard/settings/SettingsGroup';

interface SettingsExportSectionProps {
    onExport: () => void | Promise<void>;
    loading?: boolean;
}

export function SettingsExportSection({ onExport, loading = false }: SettingsExportSectionProps) {
    return (
        <SettingsRow
            title="Reporte de Cuenta Completo"
            icon={Download}
            description="Genera un archivo HTML estático con toda la información de tu perfil, historial de comandos y credenciales, listo para visualizar offline."
            control={
                <button
                    type="button"
                    onClick={() => void onExport()}
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {loading ? 'Generando...' : 'Generar Reporte'}
                </button>
            }
        />
    );
}
