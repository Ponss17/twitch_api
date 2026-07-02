import { Construction } from 'lucide-react';

import { card, fadeIn } from '@/core/ui/tw';

interface StatsConstructionNoticeProps {
    delay?: number;
}

export function StatsConstructionNotice({ delay = 180 }: StatsConstructionNoticeProps) {
    const delayClass = delay > 0 ? `[animation-delay:${delay}ms]` : '';

    return (
        <div
            className={`${card} ${fadeIn} mb-0 flex flex-col items-center gap-3 border border-dashed border-white/[0.1] bg-white/[0.02] p-4 opacity-0 min-[520px]:flex-row min-[520px]:text-left ${delayClass}`.trim()}
        >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-[#71717a]">
                <Construction className="size-5" aria-hidden />
            </div>
            <div className="text-center min-[520px]:text-left">
                <p className="text-[0.9rem] font-semibold text-[#d4d4d8]">Sección en construcción</p>
                <p className="mt-0.5 text-[0.8rem] leading-relaxed text-[#71717a]">
                    Estamos trabajando en más gráficas e históricos. Por ahora solo verás el uso del día actual.
                </p>
            </div>
        </div>
    );
}
