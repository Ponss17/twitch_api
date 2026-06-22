import { parseActivityLogParts, type ActivityLogItem } from '@/lib/activityLogDisplay';

interface HomeActivityLogEntryProps {
    item: ActivityLogItem;
}

export function HomeActivityLogEntry({ item }: HomeActivityLogEntryProps) {
    const time = item.timestamp
        ? new Date(item.timestamp).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
          })
        : '';
    const { user, message } = parseActivityLogParts(item);

    return (
        <div className="animate-slide-in-soft flex items-center gap-3 border-b border-white/[0.03] py-2 font-[Consolas,Cascadia_Code,monospace] text-[0.9rem]">
            <span className="shrink-0 text-[0.8rem] text-[#71717a]">[{time}]</span>
            <span className="min-w-0 text-[#a1a1aa]">
                {user ? (
                    <>
                        <strong className="font-semibold text-primary">@{user}</strong>{' '}
                    </>
                ) : null}
                <span className="text-[#fafafa]">{message}</span>
            </span>
        </div>
    );
}
