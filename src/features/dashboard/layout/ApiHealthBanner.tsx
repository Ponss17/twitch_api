import { useEffect, useState } from 'react';
import { RefreshCw, WifiOff, X } from 'lucide-react';
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

    const busy = status === 'checking';

    return (
        <div
            role="status"
            className="mb-3 flex items-center gap-2.5 rounded-lg border border-border-subtle bg-bg-secondary/80 px-3 py-2 text-[0.8125rem] text-text-muted"
        >
            <WifiOff className="size-3.5 shrink-0 opacity-80" aria-hidden />
            <p className="min-w-0 flex-1 leading-snug text-text-main/90">
                {busy ? hT.checking : hT.down}
            </p>
            <button
                type="button"
                onClick={() => void check()}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[0.7rem] font-semibold text-text-main hover:bg-white/[0.04] disabled:opacity-50"
            >
                <RefreshCw className={`size-3 ${busy ? 'animate-spin' : ''}`} aria-hidden />
                {busy ? t.common.retrying : t.common.retry}
            </button>
            <button
                type="button"
                onClick={() => setDismissedWhileDown(true)}
                className="rounded-md p-1 text-text-muted hover:bg-white/[0.04] hover:text-text-main"
                aria-label={t.common.aria.close}
            >
                <X className="size-3.5" aria-hidden />
            </button>
        </div>
    );
}
