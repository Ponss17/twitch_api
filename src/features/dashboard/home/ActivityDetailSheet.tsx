import { Sheet } from '@/shared/ui/Sheet';
import { User, Calendar, Clock, Activity, FileJson, Copy } from 'lucide-react';
import {
    getActivityMeta,
    sanitizeActivityUser,
    formatActivityTime,
    type ActivityLogItem
} from '@/features/dashboard/lib/activityLogDisplay';
import { btnSecondary } from '@/core/utils/tw';
import { useTranslation } from '@/core/i18n/I18nContext';

interface ActivityDetailSheetProps {
    item: ActivityLogItem | null;
    onClose: () => void;
    timeZone?: string;
}

function DetailRow({ icon: Icon, label, value, highlight = false, isLast = false }: { icon: React.ElementType; label: string; value: React.ReactNode; highlight?: boolean; isLast?: boolean }) {
    return (
        <div className={`flex items-center justify-between py-3 ${isLast ? '' : 'border-b border-white/[0.04]'}`}>
            <div className="flex items-center gap-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.03] text-zinc-400`}>
                    <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[0.75rem] font-medium tracking-wide text-zinc-400">
                    {label}
                </span>
            </div>
            <div className={`text-[0.8rem] text-right max-w-[60%] truncate ${highlight ? 'font-medium text-primary' : 'text-[#fafafa]'}`}>
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
            const bcp47 = locale === 'es' ? 'es-ES' : 'en-US';
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
                    <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] shadow-lg`}>
                        <TypeIcon className={`h-7 w-7 text-primary`} />
                    </div>
                    <h3 className="text-lg font-semibold text-white tracking-tight">
                        {meta.label}
                    </h3>
                </div>

                {/* Flat List Card */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] px-4 py-1">
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

                {/* JSON Metadata (Cleaner style) */}
                <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[0.7rem] font-bold tracking-widest text-zinc-500 uppercase">
                            {iT.technicalMetadata}
                        </span>
                        <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(jsonStr)}
                            className={`${btnSecondary} flex-none w-auto h-7 px-3 text-[0.65rem] font-medium`}
                        >
                            <Copy className="h-3 w-3" />
                            {iT.copy}
                        </button>
                    </div>
                    <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-black/40">
                        {/* Editor Header Dots */}
                        <div className="flex items-center gap-1.5 border-b border-white/[0.04] bg-white/[0.02] px-4 py-2.5">
                            <span className="flex items-center gap-1.5 text-[0.65rem] font-medium text-zinc-500">
                                <FileJson className="h-3 w-3" />
                                event.json
                            </span>
                        </div>
                        <div className="flex">
                            <div className="flex flex-col items-end border-r border-white/[0.04] bg-white/[0.01] px-3 py-4 text-[0.65rem] text-zinc-600 font-mono select-none">
                                {jsonStr.split('\n').map((_, i) => (
                                    <span key={i} className="leading-[1.4rem]">{i + 1}</span>
                                ))}
                            </div>
                            <pre className="overflow-x-auto p-4 text-[0.75rem] font-mono leading-[1.4rem] text-[#c4c4cc] [scrollbar-width:thin]">
                                {jsonStr.split('\n').map((line, i) => {
                                    const coloredLine = line
                                        .replace(/"([^"]+)":/g, '<span class="text-white font-medium">"$1"</span>:')
                                        .replace(/: ("[^"]*")/g, ': <span class="text-primary">$1</span>')
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
