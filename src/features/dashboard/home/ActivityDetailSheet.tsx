import { Sheet } from '@/shared/ui/Sheet';
import { User, Calendar, Clock, Activity, FileJson, Copy } from 'lucide-react';
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

function DetailRow({ icon: Icon, label, value, highlight = false, isLast = false }: { icon: React.ElementType; label: string; value: React.ReactNode; highlight?: boolean; isLast?: boolean }) {
    return (
        <div className={`flex items-center justify-between py-3 ${isLast ? '' : 'border-b border-border-subtle/70'}`}>
            <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[0.75rem] font-medium tracking-wide text-text-muted">
                    {label}
                </span>
            </div>
            <div className={`text-[0.8rem] text-right max-w-[60%] truncate ${highlight ? 'font-medium text-brand-text' : 'text-text-main'}`}>
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
    const TypeIcon = meta.icon;
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
        <Sheet
            open={!!item}
            onClose={onClose}
            title={iT.title}
        >
            <div className="flex flex-col gap-6 pt-1 pb-6">
                {/* Clean Header */}
                <div className="flex flex-col items-center justify-center py-4 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-[0_0_30px_-5px_var(--primary)]/20">
                        <TypeIcon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-main tracking-tight">
                        {meta.label}
                    </h3>
                </div>

                {/* Flat List Card */}
                <div className="rounded-xl border border-border-subtle bg-bg-secondary/70 backdrop-blur-xs px-4 py-1 shadow-xs">
                    <DetailRow icon={Calendar} label={iT.date} value={date || iT.unknownDate} />
                    <DetailRow icon={Clock} label={iT.time} value={time || iT.unknownTime} />
                    {user && (
                        <DetailRow 
                            icon={User} 
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
                    <DetailRow icon={Activity} label={iT.summary} value={detail} isLast />
                </div>

                {/* JSON Metadata */}
                <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[0.7rem] font-bold tracking-widest text-text-muted uppercase">
                            {iT.technicalMetadata}
                        </span>
                        <button
                            type="button"
                            onClick={() => void copyText(jsonStr)}
                            className={`${btnSecondary} flex-none w-auto h-7 px-3 text-[0.65rem] font-medium`}
                        >
                            <Copy className="h-3 w-3" />
                            {iT.copy}
                        </button>
                    </div>
                    <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-bg-main shadow-inner">
                        {/* Editor Header Dots */}
                        <div className="flex items-center gap-1.5 border-b border-border-subtle bg-bg-tertiary/60 px-4 py-2.5">
                            <span className="flex items-center gap-1.5 text-[0.65rem] font-medium text-text-muted">
                                <FileJson className="h-3 w-3 text-primary" />
                                event.json
                            </span>
                        </div>
                        <div className="flex">
                            <div className="flex flex-col items-end border-r border-border-subtle bg-bg-tertiary/30 px-3 py-4 text-[0.65rem] text-text-muted/60 font-mono select-none">
                                {jsonStr.split('\n').map((_, i) => (
                                    <span key={i} className="leading-[1.4rem]">{i + 1}</span>
                                ))}
                            </div>
                            <pre className="overflow-x-auto bg-bg-main/60 p-4 text-[0.75rem] font-mono leading-[1.4rem] text-text-muted [scrollbar-width:thin]">
                                {jsonStr.split('\n').map((line, i) => {
                                    const escapeHtml = (s: string) =>
                                        s
                                            .replace(/&/g, '&amp;')
                                            .replace(/</g, '&lt;')
                                            .replace(/>/g, '&gt;')
                                            .replace(/"/g, '&quot;');
                                    const safe = escapeHtml(line);
                                    const coloredLine = safe
                                        .replace(/&quot;([^&]+)&quot;:/g, '<span class="text-text-main font-medium">&quot;$1&quot;</span>:')
                                        .replace(/: (&quot;[^&]*&quot;)/g, ': <span class="text-brand-text">$1</span>')
                                        .replace(/: ([0-9]+)/g, ': <span class="text-primary">$1</span>')
                                        .replace(/: (true|false|null)/g, ': <span class="text-primary/80">$1</span>');
                                    return <div key={i} dangerouslySetInnerHTML={{ __html: coloredLine || ' ' }} />;
                                })}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </Sheet>
    );
}
