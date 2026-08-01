import { Download, Loader2 } from 'lucide-react';
import { SettingsRow } from '@/features/dashboard/settings/SettingsGroup';
import { useTranslation } from '@/core/i18n/I18nContext';

interface SettingsExportSectionProps {
    onExport: () => void | Promise<void>;
    loading?: boolean;
}

export function SettingsExportSection({ onExport, loading = false }: SettingsExportSectionProps) {
    const { t } = useTranslation();
    const pT = t.settings.panels;

    return (
        <SettingsRow
            title={pT.fullReport}
            icon={Download}
            description={pT.exportDesc}
            control={
                <button
                    type="button"
                    onClick={() => void onExport()}
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {loading ? t.common.loading : pT.exportReport}
                </button>
            }
        />
    );
}
