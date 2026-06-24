import { Terminal } from 'lucide-react';

import { card, fadeIn } from '@/lib/tw';
import { formatActivityDate, type ActivityLogItem } from '@/lib/activityLogDisplay';
import { HomeActivityLogEntry } from '@/components/views/HomeActivityLogEntry';

interface HomeActivityFeedProps {
    activity: ActivityLogItem[];
    syncing: boolean;
    syncLabel: string;
}

const LOG_DATE_DIVIDER =
    "relative mt-1 py-2 pb-1 text-center text-[0.75rem] uppercase tracking-[1px] text-[#71717a] before:absolute before:left-0 before:top-1/2 before:h-px before:w-[calc(50%-40px)] before:bg-white/[0.08] before:content-[''] after:absolute after:right-0 after:top-1/2 after:h-px after:w-[calc(50%-40px)] after:bg-white/[0.08] after:content-['']";

export function HomeActivityFeed({ activity, syncing, syncLabel }: HomeActivityFeedProps) {
    let lastDateLabel = '';

    return (
        <div className={`group/card ${card} ${fadeIn} mb-0 flex h-[420px] flex-col`}>
            <div className="mb-2 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2">
                <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-[0.9rem] text-primary">
                        <Terminal />
                    </div>
                    <div>
                        <h3 className="mb-0.5 text-[0.95rem] font-bold">Historial de Actividad</h3>
                        <p className="text-[0.8rem] text-[#a1a1aa]">
                            Monitoreo en vivo del uso de comandos •{' '}
                            <span
                                className={`ml-1 text-[0.85em] font-medium opacity-60 transition-all duration-300 group-hover/card:opacity-100 group-hover/card:text-primary ${syncing ? 'animate-blink-soft text-primary opacity-100' : ''}`}
                            >
                                {syncing ? 'Sincronizando...' : syncLabel}
                            </span>
                        </p>
                    </div>
                </div>
                <div>
                    <span className="animate-blink rounded bg-error px-1.5 py-0.5 text-[0.6rem] font-black uppercase tracking-[0.1em] text-white">
                        LIVE
                    </span>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-5 text-[#fafafa]">
                <div
                    className={`block h-full overflow-y-auto rounded-xl border border-white/[0.03] bg-black/15 p-4 [scrollbar-color:#9146ff_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-[10px] [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar]:w-1 ${
                        activity.length === 0
                            ? 'flex min-h-[320px] items-center justify-center !p-0'
                            : ''
                    }`}
                >
                    {activity.length === 0 ? (
                        <div className="flex w-full items-center justify-center gap-2 p-8 text-[0.9rem] text-[#a1a1aa] opacity-50">
                            <span className="inline-block w-0 overflow-hidden whitespace-nowrap border-r-0 tracking-[0.1em] animate-[emptyTyping_10s_steps(22)_infinite,emptyPulseOpacity_10s_infinite]">
                                esperando actividad...
                            </span>
                            <span className="animate-slow-blink font-bold text-[#a1a1aa]">_</span>
                        </div>
                    ) : (
                        activity.slice(0, 50).map((item, i) => {
                            const dateLabel = item.timestamp ? formatActivityDate(item.timestamp) : '';
                            const showDivider = dateLabel && dateLabel !== lastDateLabel;
                            if (showDivider) lastDateLabel = dateLabel;

                            return (
                                <div key={`${item.timestamp}-${i}`}>
                                    {showDivider && <div className={LOG_DATE_DIVIDER}>{dateLabel}</div>}
                                    <HomeActivityLogEntry item={item} />
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
