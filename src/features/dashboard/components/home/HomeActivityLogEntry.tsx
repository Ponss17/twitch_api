import {
    activityEntryKey,
    formatActivityRelativeTime,
    formatActivityTime,
    getActivityMeta,
    sanitizeActivityUser,
    type ActivityLogItem
} from '@/features/dashboard/lib/activityLogDisplay';

interface HomeActivityLogEntryProps {
    item: ActivityLogItem;
    isNew?: boolean;
}

export function HomeActivityLogEntry({ item, isNew = false }: HomeActivityLogEntryProps) {
    const meta = getActivityMeta(item.type);
    const Icon = meta.icon;
    const user = sanitizeActivityUser(item.user);
    const detail = meta.detailText(item);
    const time = item.timestamp ? formatActivityTime(item.timestamp) : '';
    const relative = item.timestamp ? formatActivityRelativeTime(item.timestamp) : '';

    return (
        <div
            data-entry-key={activityEntryKey(item)}
            className={`flex items-start gap-3 border-b border-white/[0.03] py-2.5 transition-colors duration-500 ${
                isNew ? 'border-l-2 border-l-primary bg-primary/[0.08] pl-2' : ''
            } ${isNew ? 'animate-slide-in-soft' : ''}`}
        >
            <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${meta.iconClass}`}
                aria-hidden
            >
                <Icon className="h-3.5 w-3.5" />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-[0.85rem] font-semibold text-[#fafafa]">{meta.label}</span>
                    {user ? (
                        <span className="text-[0.85rem] font-medium text-primary">@{user}</span>
                    ) : null}
                    {detail ? (
                        <span className="min-w-0 truncate text-[0.8rem] text-[#c4c4cc]">{detail}</span>
                    ) : null}
                </div>
            </div>

            <div className="shrink-0 text-right leading-tight">
                {time ? <div className="text-[0.75rem] tabular-nums text-[#71717a]">{time}</div> : null}
                {relative ? (
                    <div className="text-[0.7rem] text-[#52525b]">{relative}</div>
                ) : null}
            </div>
        </div>
    );
}
