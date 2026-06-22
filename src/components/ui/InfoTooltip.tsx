import type { ReactNode } from 'react';

interface InfoTooltipProps {
    text: ReactNode;
    className?: string;
}

export function InfoTooltip({ text, className }: InfoTooltipProps) {
    return (
        <div
            className={`group/info relative cursor-help text-[1.1rem] text-[#71717a] transition hover:text-primary${
                className ? ` ${className}` : ''
            }`}
        >
            <i className="fa-solid fa-circle-question" aria-hidden />
            <span className="pointer-events-none absolute right-[-10px] bottom-[calc(100%+10px)] z-[100] w-[240px] rounded-lg border border-white/[0.08] bg-bg-card p-3.5 text-left font-[Outfit,sans-serif] text-[0.85rem] leading-snug font-normal text-[#fafafa] opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition group-hover/info:-translate-y-1 group-hover/info:opacity-100">
                {text}
            </span>
        </div>
    );
}
