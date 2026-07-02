import { TrendingUp } from 'lucide-react';

export function StatsSyncBadge({ syncing, label }: { syncing: boolean; label: string }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[0.7rem] font-medium text-[#c4c4cc] ${syncing ? 'border-primary/30 text-primary' : ''}`}
        >
            <span
                className={`size-1.5 rounded-full ${syncing ? 'animate-pulse bg-primary' : label === 'Realtime' ? 'bg-emerald-400' : 'bg-[#71717a]'}`}
            />
            {syncing ? 'Sincronizando' : label}
        </span>
    );
}

export function StatsEmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-[#71717a]">
                <TrendingUp className="size-5 opacity-60" aria-hidden />
            </div>
            <p className="text-[0.85rem] text-[#c4c4cc]">{message}</p>
        </div>
    );
}
