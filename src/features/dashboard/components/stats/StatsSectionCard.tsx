import type { ElementType, ReactNode } from 'react';

import { card, fadeIn } from '@/core/ui/tw';
import { CardHeaderIcon } from '@/shared/ui/Icon';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';

interface StatsSectionCardProps {
    icon: ElementType;
    title: string;
    subtitle: string;
    info: ReactNode;
    delay?: number;
    headerExtra?: ReactNode;
    children: ReactNode;
    className?: string;
}

export function StatsSectionCard({
    icon,
    title,
    subtitle,
    info,
    delay = 0,
    headerExtra,
    children,
    className = ''
}: StatsSectionCardProps) {
    const delayClass = delay > 0 ? `[animation-delay:${delay}ms]` : '';

    return (
        <div className={`${card} ${fadeIn} mb-3 opacity-0 ${delayClass} ${className}`.trim()}>
            <div className="mb-2 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2">
                <div className="flex min-w-0 items-center gap-3">
                    <CardHeaderIcon icon={icon} />
                    <div className="min-w-0">
                        <h3 className="mb-0.5 text-[0.95rem] font-bold">{title}</h3>
                        <p className="text-[0.8rem] text-[#c4c4cc]">{subtitle}</p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {headerExtra}
                    <InfoTooltip text={info} />
                </div>
            </div>
            {children}
        </div>
    );
}
