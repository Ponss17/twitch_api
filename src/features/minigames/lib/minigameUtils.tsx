import { Check, AlertTriangle, Loader2, type LucideIcon } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
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
    const loading = result.status === 'loading';
    const success = result.status === 'success';

    const [visible, setVisible] = useState(false);
    const [isHiding, setIsHiding] = useState(false);

    useEffect(() => {
        if (loading) {
            setVisible(true);
            setIsHiding(false);
            return;
        }

        if (!isActive) {
            setVisible(false);
            setIsHiding(false);
            return;
        }

        setVisible(true);
        setIsHiding(false);

        const fadeTimer = window.setTimeout(() => setIsHiding(true), 8_000);
        const hideTimer = window.setTimeout(() => setVisible(false), 10_000);

        return () => {
            window.clearTimeout(fadeTimer);
            window.clearTimeout(hideTimer);
        };
    }, [isActive, loading, result.status, result.message]);

    if (loading) {
        return (
            <div
                className={`${gameResponseCard} animate-reveal-card border-border-strong bg-[rgba(15,23,42,0.6)] text-text-main`}
            >
                {loadingNode}
            </div>
        );
    }

    if (!isActive || !visible) return null;

    return (
        <div
            className={`${gameResponseCard} animate-reveal-card ${
                success
                    ? 'border-primary/30 bg-primary/10 text-text-main'
                    : 'border-error/30 bg-error/15 text-error'
            }`}
            style={{
                opacity: isHiding ? 0 : 1,
                transition: isHiding ? 'opacity 2s ease-out' : undefined
            }}
        >
            {success && <SuccessIcon className="text-lg text-primary" aria-hidden="true" />}
            {result.status === 'error' && <ErrorIcon className="text-lg" aria-hidden="true" />}
            <div className="min-w-0 flex-1">{result.message}</div>
        </div>
    );
}

export { Loader2 };
