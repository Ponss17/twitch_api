import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { SettingsRow } from '@/features/dashboard/settings/components/SettingsGroup';
import { Modal, ModalCloseButton } from '@/shared/ui/modals/Modal';
import { useTranslation } from '@/core/i18n/I18nContext';
import { btnSecondary, modalBtnPrimary, modalBtnSecondary } from '@/core/utils/tw';

export type SettingsExportOptions = {
    includeActivity?: boolean;
    includeApiKey?: boolean;
};

interface SettingsExportSectionProps {
    onExport: (format: 'html' | 'csv', options?: SettingsExportOptions) => void | Promise<void>;
    loading?: 'html' | 'csv' | null;
}

function optionRow(
    id: string,
    checked: boolean,
    onChange: (next: boolean) => void,
    title: string,
    hint: string,
    disabled: boolean
) {
    return (
        <label
            htmlFor={id}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                checked
                    ? 'border-border-strong bg-bg-secondary'
                    : 'border-border-subtle bg-bg-main/40 hover:border-border-strong hover:bg-white/[0.02]'
            } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        >
            <input
                id={id}
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-primary"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange(e.target.checked)}
            />
            <span className="min-w-0">
                <span className="block text-[0.85rem] font-medium text-text-main">{title}</span>
                <span className="mt-0.5 block text-[0.75rem] leading-snug text-text-muted">{hint}</span>
            </span>
        </label>
    );
}

export function SettingsExportSection({ onExport, loading = null }: SettingsExportSectionProps) {
    const { t } = useTranslation();
    const pT = t.settings.panels;
    const [htmlModalOpen, setHtmlModalOpen] = useState(false);
    const [includeActivity, setIncludeActivity] = useState(false);
    const [includeApiKey, setIncludeApiKey] = useState(false);

    const htmlBusy = loading === 'html';
    const csvBusy = loading === 'csv';
    const anyBusy = loading !== null;

    useEffect(() => {
        if (!htmlModalOpen) return;
        setIncludeActivity(false);
        setIncludeApiKey(false);
    }, [htmlModalOpen]);

    const closeHtmlModal = () => {
        if (htmlBusy) return;
        setHtmlModalOpen(false);
    };

    const confirmHtmlExport = () => {
        void Promise.resolve(onExport('html', { includeActivity, includeApiKey })).finally(() => {
            setHtmlModalOpen(false);
        });
    };

    return (
        <>
            <SettingsRow
                title={pT.fullReport}
                icon={Download}
                description={pT.exportDesc}
                control={
                    <button
                        type="button"
                        onClick={() => setHtmlModalOpen(true)}
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

            <Modal
                open={htmlModalOpen}
                onClose={closeHtmlModal}
                title={pT.exportModalTitle}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={confirmHtmlExport}
                            disabled={htmlBusy}
                            data-modal-primary
                            className={modalBtnPrimary}
                        >
                            {htmlBusy ? (
                                <Loader2 className="size-4 shrink-0 animate-spin" />
                            ) : (
                                <Download className="size-4 shrink-0" />
                            )}
                            {htmlBusy ? t.common.loading : pT.exportModalConfirm}
                        </button>
                        <ModalCloseButton className={modalBtnSecondary} disabled={htmlBusy}>
                            {t.common.cancel}
                        </ModalCloseButton>
                    </>
                }
            >
                <p className="text-sm leading-relaxed text-text-muted">{pT.exportModalDesc}</p>
                <fieldset className="mt-4 space-y-2 border-0 p-0">
                    <legend className="mb-1.5 text-[0.75rem] font-semibold uppercase tracking-wide text-text-muted">
                        {pT.exportModalOptions}
                    </legend>
                    {optionRow(
                        'export-include-activity',
                        includeActivity,
                        setIncludeActivity,
                        pT.exportIncludeActivity,
                        pT.exportIncludeActivityHint,
                        htmlBusy
                    )}
                    {optionRow(
                        'export-include-api-key',
                        includeApiKey,
                        setIncludeApiKey,
                        pT.exportIncludeApiKey,
                        pT.exportIncludeApiKeyHint,
                        htmlBusy
                    )}
                </fieldset>
            </Modal>
        </>
    );
}
