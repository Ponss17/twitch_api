import { Check, AlertTriangle, Loader2, type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';
import { gameResponseCard } from '@/core/utils/tw';
import { extractApiErrorMessage, formatApiErrorForUi } from '@/core/api/apiError';

export type TestResult = { status: 'idle' | 'loading' | 'success' | 'error'; message: string };

export const TWITCH_LOGIN = /^@?[a-zA-Z0-9_]{1,25}$/;

export function normalizeTwitchLogin(raw: string): string {
    return raw.trim().replace(/^@+/, '');
}

export function parseApiError(text: string): string {
    try {
        return formatApiErrorForUi(extractApiErrorMessage(JSON.parse(text) as unknown, text));
    } catch {
        return formatApiErrorForUi(text);
    }
}

export function GameResponse({
    result,
    loadingNode,
    successIcon: SuccessIcon = Check,
    errorIcon: ErrorIcon = AlertTriangle
}: {
    result: TestResult;
    loadingNode?: ReactNode;
    successIcon?: LucideIcon;
    errorIcon?: LucideIcon;
}) {
    const isActive = result.status === 'success' || result.status === 'error';
    if (!isActive && result.status !== 'loading') return null;

    const success = result.status === 'success';
    const loading = result.status === 'loading';

    return (
        <div
            className={`${gameResponseCard} animate-reveal-card ${
                loading
                    ? 'border-border-strong bg-[rgba(15,23,42,0.6)] text-text-main'
                    : success
                      ? 'border-success/30 bg-[rgba(16,185,129,0.15)] text-success'
                      : 'border-error/30 bg-error/15 text-error'
            }`}
        >
            {loading && loadingNode}
            {success && <SuccessIcon className="text-lg" aria-hidden="true" />}
            {result.status === 'error' && <ErrorIcon className="text-lg" aria-hidden="true" />}
            {!loading && <div className="min-w-0 flex-1">{result.message}</div>}
        </div>
    );
}

export { Loader2 };
