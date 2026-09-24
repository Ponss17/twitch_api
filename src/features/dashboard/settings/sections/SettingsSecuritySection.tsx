import { Key, EyeOff, Eye, Check, RotateCw, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SettingsRow } from '@/features/dashboard/settings/components/SettingsGroup';
import { useTranslation } from '@/core/i18n/I18nContext';
import {
    formatAuditAbsoluteTime,
    formatAuditRelativeTime
} from '@/features/dashboard/lib/logs/auditLogDisplay';

const ROTATE_NUDGE_MS = 90 * 24 * 60 * 60 * 1000;

interface SettingsSecuritySectionProps {
    apiKey: string;
    keyVisible: boolean;
    keyLoading?: boolean;
    apiKeyLastUsedAt?: string | null;
    apiKeyRotatedAt?: string | null;
    timezone?: string;
    onToggleKey: () => void;
    onCopyKey: () => void;
    onRegenKey: () => void;
}

function formatKeyMoment(
    iso: string | null | undefined,
    timezone: string | undefined,
    t: ReturnType<typeof useTranslation>['t'],
    locale: ReturnType<typeof useTranslation>['locale']
): string {
    if (!iso) return '';
    const relative = formatAuditRelativeTime(iso, t);
    if (relative) return relative;
    return formatAuditAbsoluteTime(iso, timezone, locale);
}

export function SettingsSecuritySection({
    apiKey,
    keyVisible,
    keyLoading = false,
    apiKeyLastUsedAt,
    apiKeyRotatedAt,
    timezone,
    onToggleKey,
    onCopyKey,
    onRegenKey
}: SettingsSecuritySectionProps) {
    const { t, locale } = useTranslation();
    const pT = t.settings.panels;
    const [isKeyCopied, setIsKeyCopied] = useState(false);
    const [nudgeDismissed, setNudgeDismissed] = useState(false);

    const handleCopyKey = () => {
        onCopyKey();
        setIsKeyCopied(true);
        setTimeout(() => setIsKeyCopied(false), 2000);
    };

    const lastUsedLabel = apiKeyLastUsedAt
        ? formatKeyMoment(apiKeyLastUsedAt, timezone, t, locale)
        : pT.keyLastUsedNever;
    const rotatedLabel = apiKeyRotatedAt
        ? formatKeyMoment(apiKeyRotatedAt, timezone, t, locale)
        : pT.keyRotatedUnknown;

    const showRotateNudge = useMemo(() => {
        if (nudgeDismissed || !apiKeyRotatedAt) return false;
        const rotatedMs = new Date(apiKeyRotatedAt).getTime();
        if (Number.isNaN(rotatedMs)) return false;
        return Date.now() - rotatedMs >= ROTATE_NUDGE_MS;
    }, [apiKeyRotatedAt, nudgeDismissed]);

    return (
        <SettingsRow
            title={pT.apiKeyPrivate}
            icon={Key}
            info={pT.apiKeyInfo}
            description={pT.apiKeyWarning}
        >
            <div className="flex flex-wrap items-stretch gap-2">
                <input
                    id="profile-api-key"
                    readOnly
                    type="text"
                    value={keyVisible ? apiKey : '••••••••••••••••••••••••••••••••'}
                    aria-label={pT.apiKeyPrivate}
                    className="min-w-0 flex-1 rounded-lg border border-border-strong bg-bg-secondary px-3 py-2 font-[Consolas,monospace] text-[0.9rem] text-text-main outline-none transition-colors focus:border-primary focus:bg-primary/[0.02]"
                />
                <div className="flex shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-secondary">
                    <button
                        type="button"
                        onClick={onToggleKey}
                        disabled={keyLoading}
                        title={pT.toggleVisibility}
                        aria-label={pT.toggleVisibility}
                        className="flex items-center justify-center px-3 text-text-muted transition hover:bg-white/[0.02] hover:text-text-main"
                    >
                        {keyVisible ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={handleCopyKey}
                        disabled={keyLoading}
                        title={pT.copyKey}
                        aria-label={pT.copyKey}
                        className="flex items-center justify-center gap-1.5 border-l border-border-subtle px-3 text-[0.82rem] text-text-muted transition hover:bg-white/[0.02] hover:text-text-main"
                    >
                        {isKeyCopied ? (
                            <Check className="h-4 w-4" aria-hidden="true" />
                        ) : (
                            <Copy className="h-4 w-4" aria-hidden="true" />
                        )}
                        {isKeyCopied ? t.common.copied : pT.copyKey}
                    </button>
                    <button
                        type="button"
                        onClick={onRegenKey}
                        title={pT.regenKey}
                        aria-label={pT.regenKey}
                        className="flex items-center justify-center border-l border-border-subtle px-3 text-text-muted transition hover:bg-white/[0.02] hover:text-text-main"
                    >
                        <RotateCw className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-[0.75rem] font-medium text-brand-text">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    {pT.activeKey}
                </span>
                <span className="text-[0.75rem] text-text-muted">{pT.activeKeyDesc}</span>
            </div>

            <dl className="mt-3 grid gap-1.5 text-[0.75rem] text-text-muted sm:grid-cols-2">
                <div>
                    <dt className="font-medium text-text-main">{pT.keyLastUsed}</dt>
                    <dd>{lastUsedLabel}</dd>
                </div>
                <div>
                    <dt className="font-medium text-text-main">{pT.keyRotated}</dt>
                    <dd>{rotatedLabel}</dd>
                </div>
            </dl>

            {showRotateNudge ? (
                <div
                    role="status"
                    className="mt-3 flex flex-col gap-2.5 rounded-lg border border-border-subtle bg-bg-secondary/60 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3"
                >
                    <div className="flex min-w-0 flex-1 items-start gap-2.5">
                        <span
                            className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary"
                            aria-hidden
                        >
                            <RotateCw className="size-3.5" />
                        </span>
                        <p className="min-w-0 text-[0.75rem] leading-relaxed text-text-muted">
                            {pT.keyRotateNudge}
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                        <button
                            type="button"
                            onClick={onRegenKey}
                            className="rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1 text-[0.7rem] font-semibold text-brand-text transition-colors hover:bg-primary/15"
                        >
                            {pT.keyRotateNudgeCta}
                        </button>
                        <button
                            type="button"
                            onClick={() => setNudgeDismissed(true)}
                            className="rounded-md px-2 py-1 text-[0.7rem] text-text-muted transition-colors hover:bg-white/[0.04] hover:text-text-main"
                        >
                            {t.announcements.dismiss}
                        </button>
                    </div>
                </div>
            ) : null}
        </SettingsRow>
    );
}
