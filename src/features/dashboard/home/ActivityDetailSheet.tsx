import { Sheet } from '@/shared/ui/Sheet';
import {
    getActivityMeta,
    sanitizeActivityUser,
    sanitizeActivitySecrets,
    formatActivityTime,
    type ActivityLogItem
} from '@/features/dashboard/lib/logs/activityLogDisplay';
import { btnSecondary } from '@/core/utils/tw';
import { useTranslation, getBcp47 } from '@/core/i18n/I18nContext';
import { copyText } from '@/core/utils/clipboard';

interface ActivityDetailSheetProps {
    item: ActivityLogItem | null;
    onClose: () => void;
    timeZone?: string;
}

function DetailRow({
    label,
    value,
    highlight = false,
    isLast = false,
    multiline = false
}: {
    label: string;
    value: React.ReactNode;
    highlight?: boolean;
    isLast?: boolean;
    multiline?: boolean;
}) {
    if (multiline) {
        return (
            <div className={`flex flex-col gap-1.5 py-3 ${isLast ? '' : 'border-b border-border-subtle/70'}`}>
                <span className="text-[0.75rem] font-medium tracking-wide text-text-muted">{label}</span>
                <div
                    className={`whitespace-pre-wrap break-words text-[0.8rem] leading-relaxed ${
                        highlight ? 'font-medium text-primary' : 'text-text-main'
                    }`}
                >
                    {value}
                </div>
            </div>
        );
    }

    return (
        <div
            className={`flex items-center justify-between gap-4 py-3 ${isLast ? '' : 'border-b border-border-subtle/70'}`}
        >
            <span className="text-[0.75rem] font-medium tracking-wide text-text-muted">{label}</span>
            <div
                className={`max-w-[60%] truncate text-right text-[0.8rem] ${
                    highlight ? 'font-medium text-primary' : 'text-text-main'
                }`}
            >
                {value}
            </div>
        </div>
    );
}

/** Resalta JSON sin innerHTML (evita XSS desde metadata). */
function JsonLine({ line }: { line: string }) {
    const keyMatch = line.match(/^(\s*)("(?:\\.|[^"\\])*")(\s*:\s*)(.*)$/);
    if (keyMatch) {
        const [, indent, key, sep, rest] = keyMatch;
        let valueNode: React.ReactNode = rest;
        if (/^".*"[,]?$/.test(rest.trim()) || /^".*"$/.test(rest.trim().replace(/,$/, ''))) {
            valueNode = <span className="text-brand-text">{rest}</span>;
        } else if (/^(true|false|null)(,)?$/.test(rest.trim())) {
            valueNode = <span className="text-primary/80">{rest}</span>;
        } else if (/^-?\d+(\.\d+)?(,)?$/.test(rest.trim())) {
            valueNode = <span className="text-primary">{rest}</span>;
        }
        return (
            <div className="leading-[1.4rem]">
                {indent}
                <span className="font-medium text-text-main">{key}</span>
                {sep}
                {valueNode}
            </div>
        );
    }
    return <div className="leading-[1.4rem]">{line || ' '}</div>;
}

function readSanitizedMeta(item: ActivityLogItem): {
    response?: string;
    latencyLabel?: string;
    lang?: string;
    format?: string;
    mood?: string;
    hardcore?: string;
} {
    const sanitized = sanitizeActivitySecrets(item.metadata ?? {}) as Record<string, unknown>;
    const asTrimmed = (key: string): string | undefined => {
        const v = sanitized[key];
        return typeof v === 'string' && v.trim() ? v.trim() : undefined;
    };
    const response = asTrimmed('response');
    const latencyMs = sanitized.latencyMs;
    const latencyLabel =
        typeof latencyMs === 'number' && Number.isFinite(latencyMs) ? `${latencyMs} ms` : undefined;
    return {
        response,
        latencyLabel,
        lang: asTrimmed('lang'),
        format: asTrimmed('format'),
        mood: asTrimmed('mood'),
        hardcore: asTrimmed('hardcore')
    };
}

export function ActivityDetailSheet({ item, onClose, timeZone }: ActivityDetailSheetProps) {
    const { t, locale } = useTranslation();
    const iT = t.home.activityInspector;

    if (!item) return null;

    const meta = getActivityMeta(item.type, t);
    const user = sanitizeActivityUser(item.user);
    const detail = meta.detailText(item);
    const { response, latencyLabel, lang, format, mood, hardcore } = readSanitizedMeta(item);
    const time = item.timestamp ? formatActivityTime(item.timestamp, timeZone, locale) : '';
    let date = '';
    if (item.timestamp) {
        const d = new Date(item.timestamp);
        if (!Number.isNaN(d.getTime())) {
            const bcp47 = getBcp47(locale);
            date = new Intl.DateTimeFormat(bcp47, {
                timeZone: timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }).format(d);
        }
    }

    const jsonLines = JSON.stringify(sanitizeActivitySecrets(item), null, 2).split('\n');
    const sanitizedJson = jsonLines.join('\n');
    const extraRows = [
        lang ? { label: iT.fieldLang, value: lang } : null,
        format ? { label: iT.fieldFormat, value: format } : null,
        mood ? { label: iT.fieldMood, value: mood } : null,
        hardcore ? { label: iT.fieldHardcore, value: hardcore } : null,
        response ? { label: iT.fieldResponse, value: response, multiline: true } : null,
        latencyLabel ? { label: iT.fieldLatency, value: latencyLabel } : null
    ].filter(Boolean) as Array<{ label: string; value: string; multiline?: boolean }>;

    return (
        <Sheet open={!!item} onClose={onClose} title={iT.title} description={meta.label}>
            <div className="flex flex-col gap-6 pt-1 pb-6">
                <div className="rounded-xl border border-border-subtle bg-bg-secondary/70 px-4 py-1 shadow-xs backdrop-blur-xs">
                    <DetailRow label={iT.date} value={date || iT.unknownDate} />
                    <DetailRow label={iT.time} value={time || iT.unknownTime} />
                    {user && (
                        <DetailRow
                            label={iT.user}
                            value={
                                <a
                                    href={`https://twitch.tv/${user}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="transition-colors hover:text-primary hover:underline"
                                >
                                    @{user}
                                </a>
                            }
                            highlight
                        />
                    )}
                    <DetailRow
                        label={iT.summary}
                        value={detail}
                        isLast={extraRows.length === 0}
                    />
                    {extraRows.map((row, index) => (
                        <DetailRow
                            key={row.label}
                            label={row.label}
                            value={row.value}
                            multiline={row.multiline}
                            isLast={index === extraRows.length - 1}
                        />
                    ))}
                </div>

                <div className="flex flex-col gap-2 pt-2">
                    <span className="px-1 text-[0.7rem] font-bold tracking-widest text-text-muted uppercase">
                        {iT.technicalMetadata}
                    </span>

                    <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-bg-main shadow-inner">
                        <div className="flex items-center justify-between gap-3 border-b border-border-subtle bg-bg-tertiary/60 px-4 py-2.5">
                            <span className="text-[0.65rem] font-medium text-text-muted">{iT.rawJson}</span>
                            <button
                                type="button"
                                onClick={() => void copyText(sanitizedJson)}
                                className={`${btnSecondary} h-7 w-auto flex-none px-3 text-[0.65rem] font-medium`}
                            >
                                {iT.copy}
                            </button>
                        </div>
                        <div className="flex">
                            <div className="flex select-none flex-col items-end border-r border-border-subtle bg-bg-tertiary/30 px-3 py-4 font-mono text-[0.65rem] text-text-muted/60">
                                {jsonLines.map((_, i) => (
                                    <span key={i} className="leading-[1.4rem]">
                                        {i + 1}
                                    </span>
                                ))}
                            </div>
                            <pre className="overflow-x-auto bg-bg-main/60 p-4 font-mono text-[0.75rem] text-text-muted [scrollbar-width:thin]">
                                {jsonLines.map((line, i) => (
                                    <JsonLine key={i} line={line} />
                                ))}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </Sheet>
    );
}
