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
    isActive?: boolean;
    timeZone?: string;
    onClick?: (item: ActivityLogItem) => void;
}

export const HomeActivityLogEntry = memo(function HomeActivityLogEntry({
    item,
    isNew = false,
    isActive = false,
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

    const stateClass = isActive
        ? 'bg-primary/[0.08]'
        : isNew
          ? 'bg-white/[0.02] animate-fade-soft'
          : '';

    return (
        <Component
            data-entry-key={activityEntryKey(item)}
            onClick={() => onClick?.(item)}
            aria-current={isActive ? 'true' : undefined}
            className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-200 ${stateClass} ${onClick ? `cursor-pointer hover:bg-white/[0.02] hover:text-text-main ${isActive ? 'hover:bg-primary/[0.08]' : ''}` : ''}`}
        >
            <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${meta.iconClass}`}
                aria-hidden
            >
                <Icon className="h-3.5 w-3.5" />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-[0.85rem] font-semibold text-text-main">{meta.label}</span>
                    {user ? (
                        <span className="text-[0.85rem] font-medium text-brand-text">@{user}</span>
                    ) : null}
                    {detail ? (
                        <span className="min-w-0 truncate text-[0.8rem] text-text-muted">{detail}</span>
                    ) : null}
                </div>
            </div>

            <div className="shrink-0 text-right leading-tight">
                {time ? <div className="text-[0.75rem] tabular-nums text-text-muted">{time}</div> : null}
                {relative ? (
                    <div className="text-[0.7rem] text-text-muted">{relative}</div>
                ) : null}
            </div>
        </Component>
    );
});
