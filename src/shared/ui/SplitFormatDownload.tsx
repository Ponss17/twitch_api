import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import {
    Dropdown,
    DropdownChevron,
    DropdownItem,
    DropdownPanel,
    DropdownTrigger
} from '@/shared/ui/dropdown/Dropdown';

export type DownloadFormat = 'html' | 'csv';

interface SplitFormatDownloadProps {
    format: DownloadFormat;
    onFormatChange: (format: DownloadFormat) => void;
    onDownload: () => void;
    downloadLabel: string;
    formatMenuLabel: string;
    htmlLabel: string;
    csvLabel: string;
    disabled?: boolean;
    busy?: boolean;
    formatTriggerId?: string;
}

export function SplitFormatDownload({
    format,
    onFormatChange,
    onDownload,
    downloadLabel,
    formatMenuLabel,
    htmlLabel,
    csvLabel,
    disabled = false,
    busy = false,
    formatTriggerId
}: SplitFormatDownloadProps) {
    return (
        <Dropdown className="relative inline-flex w-full sm:w-auto">
            <div className="inline-flex h-9 w-full min-w-0 overflow-hidden rounded-lg border border-border-strong sm:w-auto">
                <button
                    type="button"
                    data-dropdown-match
                    onClick={onDownload}
                    disabled={disabled || busy}
                    className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 bg-bg-secondary px-3.5 text-[0.8125rem] font-semibold text-text-main transition hover:bg-white/[0.02] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-4"
                >
                    {busy ? (
                        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                    ) : (
                        <Download className="size-4 shrink-0" aria-hidden />
                    )}
                    {downloadLabel}
                </button>
                <DropdownTrigger
                    id={formatTriggerId}
                    disabled={disabled || busy}
                    haspopup="listbox"
                    aria-label={formatMenuLabel}
                    className="inline-flex w-8 shrink-0 items-center justify-center border-l border-border-strong bg-bg-secondary text-text-muted transition hover:bg-white/[0.02] hover:text-text-main disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <DropdownChevron className="size-3.5 shrink-0 text-current transition-transform" />
                </DropdownTrigger>
            </div>
            <DropdownPanel
                role="listbox"
                align="right"
                padding="compact"
                matchTrigger
                widthClassName=""
                aria-label={formatMenuLabel}
            >
                <DropdownItem
                    role="option"
                    aria-selected={format === 'html'}
                    active={format === 'html'}
                    onClick={() => onFormatChange('html')}
                >
                    <Download className="size-3.5 shrink-0" aria-hidden />
                    {htmlLabel}
                </DropdownItem>
                <DropdownItem
                    role="option"
                    aria-selected={format === 'csv'}
                    active={format === 'csv'}
                    onClick={() => onFormatChange('csv')}
                >
                    <FileSpreadsheet className="size-3.5 shrink-0" aria-hidden />
                    {csvLabel}
                </DropdownItem>
            </DropdownPanel>
        </Dropdown>
    );
}
