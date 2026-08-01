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
            >
                <div className="flex w-full overflow-hidden rounded-lg border border-white/[0.06] bg-bg-secondary transition focus-within:border-primary">
                    <input
                        readOnly
                        type="text"
                        value={userId ?? '---'}
                        className="flex-1 border-none bg-transparent px-3 py-2 font-[Consolas,monospace] text-[0.85rem] text-zinc-300 outline-none"
                        aria-label={pT.userId}
                    />
                    <button
                        type="button"
                        onClick={handleCopyId}
                        title={pT.copyUserId}
                        className="flex items-center justify-center gap-1.5 border-l border-white/[0.05] bg-white/[0.02] px-3 text-[0.82rem] text-zinc-400 transition hover:bg-primary/10 hover:text-primary"
                    >
                        {isIdCopied ? (
                            <Check className="h-4 w-4" aria-hidden="true" />
                        ) : (
                            <Copy className="h-4 w-4" aria-hidden="true" />
                        )}
                        {isIdCopied ? t.common.copied : pT.copyKey}
                    </button>
                </div>
            </SettingsRow>

            <SettingsRow
                title={pT.planAndQuota}
                icon={Crown}
            >
                <div className="flex flex-wrap items-center gap-1.5">
                    <span
                        className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[0.7rem] font-semibold text-[#a78bfa]"
                        title={pT.planTooltip}
                    >
                        <Crown className="w-3 h-3 opacity-80" /> {roleLabel}
                    </span>
                    <span
                        className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-[0.7rem] font-semibold text-zinc-400"
                        title={pT.apiQuotaTooltip}
                    >
                        <Gauge className="w-3 h-3 text-primary/70" /> {rateLimit} req/min
                        {hasCustomRateLimit ? ' *' : ''}
                    </span>
                    {typeof heavyLimit === 'number' && (
                        <span
                            className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-[0.7rem] font-semibold text-zinc-400"
                            title={pT.heavyQuotaTooltip}
                        >
                            <Gauge className="w-3 h-3 text-amber-400/80" /> {heavyLimit} heavy/min
                        </span>
                    )}
                    <span
                        className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-[0.7rem] font-semibold text-zinc-400"
                        title={pT.cacheTooltip}
                    >
                        <Clock className="w-3 h-3 text-primary/70" /> {cacheTtl}s {pT.cacheTime.replace('(min)', '').trim()}
                        {hasCustomCacheTtl ? ' *' : ''}
                    </span>
                </div>
            </SettingsRow>
        </>
    );
}
