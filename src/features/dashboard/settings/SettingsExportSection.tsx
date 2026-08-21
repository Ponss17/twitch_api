import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { SettingsRow } from '@/features/dashboard/settings/SettingsGroup';
import { useTranslation } from '@/core/i18n/I18nContext';
import { btnSecondary } from '@/core/utils/tw';

interface SettingsExportSectionProps {
    onExport: (format: 'html' | 'csv') => void | Promise<void>;
    loading?: boolean;
}

export function SettingsExportSection({ onExport, loading = false }: SettingsExportSectionProps) {
    const { t } = useTranslation();
    const pT = t.settings.panels;

    return (
        <>
            <SettingsRow
                title={pT.fullReport}
                icon={Download}
                description={pT.exportDesc}
                control={
                    <button
                        type="button"
                        onClick={() => void onExport('html')}
                        disabled={loading}
                        className={`${btnSecondary} w-full min-w-[12.25rem] sm:w-auto`}
                    >
                        {loading ? (
                            <Loader2 className="size-4 shrink-0 animate-spin" />
                        ) : (
                            <Download className="size-4 shrink-0" />
                        )}
                        {loading ? t.common.loading : pT.exportReport}
                    </button>
                }
            />
            <SettingsRow
                title={pT.csvReport}
                icon={FileSpreadsheet}
                description={pT.csvDesc}
                control={
                    <button
                        type="button"
                        onClick={() => void onExport('csv')}
                        disabled={loading}
                        className={`${btnSecondary} w-full min-w-[12.25rem] sm:w-auto`}
                    >
                        {loading ? (
                            <Loader2 className="size-4 shrink-0 animate-spin" />
                        ) : (
                            <FileSpreadsheet className="size-4 shrink-0" />
                        )}
                        {loading ? t.common.loading : pT.exportCsv}
                    </button>
                }
            />
        </>
    );
}
