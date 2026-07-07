import type { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
    text: ReactNode;
    className?: string;
    /** `top` por defecto; usa `bottom` si el icono está pegado a contenido superior (p. ej. Inicio). */
    placement?: 'top' | 'bottom';
}

export function InfoTooltip({ text, className, placement = 'top' }: InfoTooltipProps) {
    const opensBelow = placement === 'bottom';

    return (
        <div
            className={`group/info relative cursor-help text-[1.1rem] text-[#71717a] transition hover:text-primary${
                className ? ` ${className}` : ''
            }`}
        >
            <HelpCircle className="w-5 h-5" aria-hidden="true" />
            <span
                className={`pointer-events-none absolute right-0 z-[200] w-[min(260px,calc(100vw-2rem))] rounded-md border border-white/[0.08] bg-bg-card p-3 text-left font-[Outfit,sans-serif] text-[0.82rem] leading-snug font-normal text-[#fafafa] opacity-0 shadow-lg transition ${
                    opensBelow
                        ? 'top-[calc(100%+8px)] group-hover/info:translate-y-0.5 group-hover/info:opacity-100'
                        : 'bottom-[calc(100%+10px)] group-hover/info:-translate-y-0.5 group-hover/info:opacity-100'
                }`}
            >
                {text}
            </span>
        </div>
    );
}
