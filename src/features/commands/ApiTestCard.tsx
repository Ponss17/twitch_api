import { Check, Loader2, AlertTriangle, Play, FlaskConical } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { btnPrimary, panelCard, responseCard, fadeIn, formGrid } from '@/core/utils/tw';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { subtleIcon } from '@/features/dashboard/lib/subtleAccents';
import { useTranslation } from '@/core/i18n/I18nContext';

interface ApiTestCardProps {
    title: string;
    description: string;
    infoTooltip?: string;
    children: ReactNode;
    onTest: () => Promise<void>;
    result: { status: 'idle' | 'loading' | 'success' | 'error'; message: string };
    buttonLabel?: string;
}

export function ApiTestCard({
    title,
    description,
    infoTooltip,
    children,
    onTest,
    result,
    buttonLabel
}: ApiTestCardProps) {
    const { t } = useTranslation();
    const isActive = result.status === 'success' || result.status === 'error';
    const finalBtnLabel = buttonLabel || t.commands.apiTest.btnTest;

    const [visible, setVisible] = useState(false);
    const [isHiding, setIsHiding] = useState(false);

    useEffect(() => {
        if (!isActive) {
            setVisible(false);
            setIsHiding(false);
            return;
        }

        setVisible(true);
        setIsHiding(false);

        const fadeTimer = setTimeout(() => setIsHiding(true), 8_000);
        const hideTimer = setTimeout(() => setVisible(false), 10_000);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(hideTimer);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [result.status]);

    return (
        <div className={`${panelCard} ${fadeIn} mb-5 flex flex-col [animation-delay:60ms]`}>
            <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                    <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${subtleIcon('primary')}`}
                    >
                        <FlaskConical className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-[0.9375rem] font-semibold tracking-tight text-text-main">{title}</h2>
                        <p className="mt-0.5 text-[0.75rem] leading-snug text-text-muted">{description}</p>
                    </div>
                </div>
                {infoTooltip ? (
                    <div className="shrink-0">
                        <InfoTooltip text={infoTooltip} placement="bottom" />
                    </div>
                ) : null}
            </header>

            <div className="p-5 text-text-main">
                <div className={formGrid}>{children}</div>

                <button
                    type="button"
                    onClick={() => void onTest()}
                    disabled={result.status === 'loading'}
                    className={btnPrimary}
                >
                    {result.status === 'loading' ? (
                        <Loader2 className="size-4 shrink-0 animate-spin" />
                    ) : (
                        <Play className="size-4 shrink-0" />
                    )}
                    {result.status === 'loading' ? t.commands.apiTest.btnTesting : finalBtnLabel}
                </button>

                <div
                    className={`${responseCard} ${
                        visible ? 'flex animate-reveal-card' : 'hidden'
                    } ${
                        result.status === 'success'
                            ? 'border-success/30 bg-[rgba(16,185,129,0.15)]'
                            : result.status === 'error'
                              ? 'border-error/30 bg-error/15'
                              : ''
                    }`}
                    style={{
                        opacity: isHiding ? 0 : 1,
                        transition: isHiding ? 'opacity 2s ease-out' : undefined
                    }}
                >
                    {result.status === 'success' && (
                        <Check className="size-5 shrink-0 text-success" />
                    )}
                    {result.status === 'error' && (
                        <AlertTriangle className="size-5 shrink-0 text-error" />
                    )}
                    <div
                        className={`min-w-0 flex-1 whitespace-pre-wrap break-words ${
                            result.status === 'success'
                                ? 'text-[#ecfdf5]'
                                : result.status === 'error'
                                  ? 'text-[#fecaca]'
                                  : 'text-text-main'
                        }`}
                    >
                        {result.message}
                    </div>
                </div>
            </div>
        </div>
    );
}
