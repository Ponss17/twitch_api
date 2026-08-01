import { memo } from 'react';
import {
    activityEntryKey,
    formatActivityRelativeTime,
    formatActivityTime,
    getActivityMeta,
    sanitizeActivityUser,
    type ActivityLogItem
} from '@/features/dashboard/lib/activityLogDisplay';
import { useTranslation } from '@/core/i18n/I18nContext';

interface HomeActivityLogEntryProps {
    item: ActivityLogItem;
    isNew?: boolean;
    timeZone?: string;
    onClick?: (item: ActivityLogItem) => void;
}

export const HomeActivityLogEntry = memo(function HomeActivityLogEntry({
    item,
    isNew = false,
    timeZone,
    onClick
}: HomeActivityLogEntryProps) {
    const { t, locale } = useTranslation();
    const meta = getActivityMeta(item.type, t);
    const Icon = meta.icon;
    const user = sanitizeActivityUser(item.user);
    const detail = meta.detailText(item);
    const time = item.timestamp ? formatActivityTime(item.timestamp, timeZone, locale) : '';
    const relative = item.timestamp ? formatActivityRelativeTime(item.timestamp, t) : '';

    const Component = onClick ? 'button' : 'div';

    return (
        <Component
            data-entry-key={activityEntryKey(item)}
            onClick={() => onClick?.(item)}
            className={`group flex w-full text-left items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200 ${isNew ? 'bg-primary/[0.08] shadow-[inset_2px_0_0_0_rgba(145,70,255,1)]' : ''} ${isNew ? 'animate-slide-in-soft' : ''} ${onClick ? 'cursor-pointer hover:bg-white/[0.02] hover:shadow-sm' : ''}`}
        >
            <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${meta.iconClass}`}
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
                {time ? <div className="text-[0.75rem] tabular-nums text-[#a1a1aa]">{time}</div> : null}
                {relative ? (
                    <div className="text-[0.7rem] text-[#71717a]">{relative}</div>
                ) : null}
            </div>
        </Component>
    );
});
