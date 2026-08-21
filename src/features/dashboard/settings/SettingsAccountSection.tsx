import { Copy, Gauge, Clock, Crown, Hash, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { SettingsRow } from '@/features/dashboard/settings/SettingsGroup';
import { useTranslation } from '@/core/i18n/I18nContext';

interface SettingsAccountSectionProps {
    userId?: string;
    rateLimit: number;
    heavyLimit?: number;
    cacheTtl: number;
    roleLabel: string;
    hasCustomRateLimit?: boolean;
    hasCustomCacheTtl?: boolean;
    onCopyId: () => void;
}

export function SettingsAccountSection({
    userId,
    rateLimit,
    heavyLimit,
    cacheTtl,
    roleLabel,
    hasCustomRateLimit,
    hasCustomCacheTtl,
    onCopyId
}: SettingsAccountSectionProps) {
    const { t } = useTranslation();
    const pT = t.settings.panels;
    const [isIdCopied, setIsIdCopied] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const handleCopyId = () => {
        onCopyId();
        setIsIdCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setIsIdCopied(false), 2000);
    };

    return (
        <>
            <SettingsRow
                title={pT.userId}
                icon={Hash}
                control={
                    <div className="flex min-w-0 max-w-full items-center gap-1.5">
                        <code className="truncate rounded-md border border-border-subtle bg-bg-secondary px-2.5 py-1.5 font-[Consolas,monospace] text-[0.8rem] text-text-main">
                            {userId ?? '---'}
                        </code>
                        <button
                            type="button"
                            onClick={handleCopyId}
                            title={pT.copyUserId}
                            aria-label={pT.copyUserId}
                            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border-subtle text-text-muted transition hover:bg-white/[0.02] hover:text-text-main"
                        >
                            {isIdCopied ? (
                                <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                            ) : (
                                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                }
            />

            <SettingsRow
                title={pT.planAndQuota}
                icon={Crown}
                control={
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <span
                            className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[0.7rem] font-semibold text-brand-text"
                            title={pT.planTooltip}
                        >
                            <Crown className="h-3 w-3 opacity-80" aria-hidden="true" /> {roleLabel}
                        </span>
                        <span
                            className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-bg-secondary px-2 py-0.5 text-[0.7rem] font-semibold text-text-muted"
                            title={pT.apiQuotaTooltip}
                        >
                            <Gauge className="h-3 w-3 text-brand-text" aria-hidden="true" /> {rateLimit}{' '}
                            req/min
                            {hasCustomRateLimit ? ' *' : ''}
                        </span>
                        {typeof heavyLimit === 'number' ? (
                            <span
                                className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-bg-secondary px-2 py-0.5 text-[0.7rem] font-semibold text-text-muted"
                                title={pT.heavyQuotaTooltip}
                            >
                                <Gauge className="h-3 w-3 text-brand-text" aria-hidden="true" />{' '}
                                {heavyLimit} heavy/min
                            </span>
                        ) : null}
                        <span
                            className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-bg-secondary px-2 py-0.5 text-[0.7rem] font-semibold text-text-muted"
                            title={pT.cacheTooltip}
                        >
                            <Clock className="h-3 w-3 text-brand-text" aria-hidden="true" /> {cacheTtl}s{' '}
                            {pT.cacheTime.replace('(min)', '').trim()}
                            {hasCustomCacheTtl ? ' *' : ''}
                        </span>
                    </div>
                }
            />
        </>
    );
}
