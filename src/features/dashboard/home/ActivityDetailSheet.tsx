import { Sheet } from '@/shared/ui/Sheet';
import {
    getActivityMeta,
    sanitizeActivityUser,
    formatActivityTime,
    type ActivityLogItem
} from '@/features/dashboard/lib/activityLogDisplay';
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
    isLast = false
}: {
    label: string;
    value: React.ReactNode;
    highlight?: boolean;
    isLast?: boolean;
}) {
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

export function ActivityDetailSheet({ item, onClose, timeZone }: ActivityDetailSheetProps) {
    const { t, locale } = useTranslation();
    const iT = t.home.activityInspector;

    if (!item) return null;

    const meta = getActivityMeta(item.type, t);
    const user = sanitizeActivityUser(item.user);
    const detail = meta.detailText(item);
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

    const jsonStr = JSON.stringify(item, null, 2);

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
                    <DetailRow label={iT.summary} value={detail} isLast />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[0.7rem] font-bold tracking-widest text-text-muted uppercase">
                            {iT.technicalMetadata}
                        </span>
                        <button
                            type="button"
                            onClick={() => void copyText(jsonStr)}
                            className={`${btnSecondary} h-7 w-auto flex-none px-3 text-[0.65rem] font-medium`}
                        >
                            {iT.copy}
                        </button>
                    </div>
                    <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-bg-main shadow-inner">
                        <div className="flex items-center border-b border-border-subtle bg-bg-tertiary/60 px-4 py-2.5">
                            <span className="text-[0.65rem] font-medium text-text-muted">event.json</span>
                        </div>
                        <div className="flex">
                            <div className="flex select-none flex-col items-end border-r border-border-subtle bg-bg-tertiary/30 px-3 py-4 font-mono text-[0.65rem] text-text-muted/60">
                                {jsonStr.split('\n').map((_, i) => (
                                    <span key={i} className="leading-[1.4rem]">
                                        {i + 1}
                                    </span>
                                ))}
                            </div>
                            <pre className="overflow-x-auto bg-bg-main/60 p-4 font-mono text-[0.75rem] leading-[1.4rem] text-text-muted [scrollbar-width:thin]">
                                {jsonStr.split('\n').map((line, i) => {
                                    const escapeHtml = (s: string) =>
                                        s
                                            .replace(/&/g, '&amp;')
                                            .replace(/</g, '&lt;')
                                            .replace(/>/g, '&gt;')
                                            .replace(/"/g, '&quot;');
                                    const safe = escapeHtml(line);
                                    const coloredLine = safe
                                        .replace(
                                            /&quot;([^&]+)&quot;:/g,
                                            '<span class="text-text-main font-medium">&quot;$1&quot;</span>:'
                                        )
                                        .replace(
                                            /: (&quot;[^&]*&quot;)/g,
                                            ': <span class="text-brand-text">$1</span>'
                                        )
                                        .replace(/: ([0-9]+)/g, ': <span class="text-primary">$1</span>')
                                        .replace(
                                            /: (true|false|null)/g,
                                            ': <span class="text-primary/80">$1</span>'
                                        );
                                    return (
                                        <div key={i} dangerouslySetInnerHTML={{ __html: coloredLine || ' ' }} />
                                    );
                                })}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </Sheet>
    );
}
