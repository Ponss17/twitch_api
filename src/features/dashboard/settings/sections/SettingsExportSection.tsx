import { useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { SettingsRow } from '@/features/dashboard/settings/components/SettingsGroup';
import { useTranslation } from '@/core/i18n/I18nContext';
import { btnSecondary } from '@/core/utils/tw';

export type SettingsExportOptions = {
    includeActivity?: boolean;
    includeApiKey?: boolean;
};

interface SettingsExportSectionProps {
    onExport: (format: 'html' | 'csv', options?: SettingsExportOptions) => void | Promise<void>;
    loading?: 'html' | 'csv' | null;
}

export function SettingsExportSection({ onExport, loading = null }: SettingsExportSectionProps) {
    const { t } = useTranslation();
    const pT = t.settings.panels;
    const [includeActivity, setIncludeActivity] = useState(false);
    const [includeApiKey, setIncludeApiKey] = useState(false);

    const htmlBusy = loading === 'html';
    const csvBusy = loading === 'csv';
    const anyBusy = loading !== null;
    const exportOptions: SettingsExportOptions = { includeActivity, includeApiKey };

    const optionRow = (
        id: string,
        checked: boolean,
        onChange: (next: boolean) => void,
        title: string,
        hint: string
    ) => (
        <label
            htmlFor={id}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                checked
                    ? 'border-border-strong bg-bg-secondary'
                    : 'border-border-subtle bg-bg-main/40 hover:border-border-strong hover:bg-white/[0.02]'
            }`}
        >
            <input
                id={id}
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-primary"
                checked={checked}
                disabled={anyBusy}
                onChange={(e) => onChange(e.target.checked)}
            />
            <span className="min-w-0">
                <span className="block text-[0.85rem] font-medium text-text-main">{title}</span>
                <span className="mt-0.5 block text-[0.75rem] leading-snug text-text-muted">{hint}</span>
            </span>
        </label>
    );

    return (
        <>
            <SettingsRow
                title={pT.fullReport}
                icon={Download}
                description={pT.exportDesc}
                control={
                    <div className="flex w-full min-w-[12.25rem] flex-col gap-2 sm:w-auto sm:items-end">
                        <div className="w-full space-y-2 sm:max-w-[18rem]">
                            {optionRow(
                                'export-include-activity',
                                includeActivity,
                                setIncludeActivity,
                                pT.exportIncludeActivity,
                                pT.exportIncludeActivityHint
                            )}
                            {optionRow(
                                'export-include-api-key',
                                includeApiKey,
                                setIncludeApiKey,
                                pT.exportIncludeApiKey,
                                pT.exportIncludeApiKeyHint
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => void onExport('html', exportOptions)}
                            disabled={anyBusy}
                            className={`${btnSecondary} w-full min-w-[12.25rem] sm:w-auto`}
                        >
                            {htmlBusy ? (
                                <Loader2 className="size-4 shrink-0 animate-spin" />
                            ) : (
                                <Download className="size-4 shrink-0" />
                            )}
                            {htmlBusy ? t.common.loading : pT.exportReport}
                        </button>
                    </div>
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
                        disabled={anyBusy}
                        className={`${btnSecondary} w-full min-w-[12.25rem] sm:w-auto`}
                    >
                        {csvBusy ? (
                            <Loader2 className="size-4 shrink-0 animate-spin" />
                        ) : (
                            <FileSpreadsheet className="size-4 shrink-0" />
                        )}
                        {csvBusy ? t.common.loading : pT.exportCsv}
                    </button>
                }
            />
        </>
    );
}
