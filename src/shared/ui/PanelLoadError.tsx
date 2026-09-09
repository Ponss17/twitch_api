import { AlertTriangle, Loader2, RotateCw } from 'lucide-react';
import { useTranslation } from '@/core/i18n/I18nContext';

interface PanelLoadErrorProps {
    message: string;
    onRetry: () => void;
    retrying?: boolean;
}

/** Error de carga del panel (Home / Analytics) con reintento. */
export function PanelLoadError({ message, onRetry, retrying = false }: PanelLoadErrorProps) {
    const { t } = useTranslation();

    return (
        <div className="rounded-xl border border-error/30 bg-error/[0.05] p-6 text-center">
            <AlertTriangle className="mx-auto mb-3 size-6 text-error" aria-hidden />
            <p className="mb-1 text-[0.95rem] font-semibold text-text-main">{t.common.loadErrorTitle}</p>
            <p className="mb-4 text-sm text-error/90">{message}</p>
            <button
                type="button"
                onClick={onRetry}
                disabled={retrying}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
                {retrying ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                    <RotateCw className="size-4" aria-hidden />
                )}
                {retrying ? t.common.retrying : t.common.retry}
            </button>
        </div>
    );
}
