import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from '@/core/i18n/I18nContext';
import { useApiHealth } from '@/features/dashboard/lib/health/useApiHealth';

export function ApiHealthBanner() {
    const { t } = useTranslation();
    const hT = t.common.apiHealth;
    const { status, check } = useApiHealth(true);
    const [dismissedWhileDown, setDismissedWhileDown] = useState(false);

    useEffect(() => {
        if (status === 'ok') setDismissedWhileDown(false);
    }, [status]);

    if (status === 'ok' || dismissedWhileDown) return null;

    return (
        <div
            role="status"
            className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-text-main"
        >
            <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden />
            <p className="min-w-0 flex-1">
                {status === 'checking' ? hT.checking : hT.down}
            </p>
            <button
                type="button"
                onClick={() => void check()}
                disabled={status === 'checking'}
                className="rounded-lg bg-bg-secondary px-3 py-1.5 text-xs font-semibold text-text-main hover:bg-bg-main disabled:opacity-60"
            >
                {status === 'checking' ? t.common.retrying : t.common.retry}
            </button>
            <button
                type="button"
                onClick={() => setDismissedWhileDown(true)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-bg-secondary hover:text-text-main"
                aria-label={t.common.aria.close}
            >
                <X className="size-4" aria-hidden />
            </button>
        </div>
    );
}
