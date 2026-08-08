import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';
import { fadeIn, panelCard } from '@/core/utils/tw';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { subtleIcon } from '@/features/dashboard/lib/subtleAccents';

export function MinigameCard({
    icon: Icon,
    title,
    description,
    info,
    children,
    staggered = false,
    centerBody = false
}: {
    icon?: LucideIcon;
    title: string;
    description: string;
    info?: string;
    children: ReactNode;
    staggered?: boolean;
    centerBody?: boolean;
}) {
    return (
        <div
            className={`${panelCard} ${fadeIn} mb-5 flex flex-col opacity-0 ${staggered ? '[animation-delay:120ms]' : ''}`}
        >
            <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                    {Icon ? (
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${subtleIcon('primary')}`}>
                            <Icon className="h-4 w-4" aria-hidden />
                        </div>
                    ) : null}
                    <div className="min-w-0">
                        <h2 className="text-[0.9375rem] font-semibold tracking-tight text-text-main">{title}</h2>
                        <p className="mt-0.5 text-[0.75rem] leading-snug text-text-muted">{description}</p>
                    </div>
                </div>
                {info ? (
                    <div className="shrink-0">
                        <InfoTooltip text={info} placement="bottom" />
                    </div>
                ) : null}
            </header>
            <div className={`p-5 text-text-main ${centerBody ? 'text-center' : ''}`}>{children}</div>
        </div>
    );
}
