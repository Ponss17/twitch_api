import { useId, type ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import { useTranslation } from '@/core/i18n/I18nContext';

interface InfoTooltipProps {
    text: ReactNode;
    className?: string;
    /** `top` por defecto; usa `bottom` si el icono está pegado a contenido superior (p. ej. Inicio). */
    placement?: 'top' | 'bottom';
}

export function InfoTooltip({ text, className, placement = 'top' }: InfoTooltipProps) {
    const opensBelow = placement === 'bottom';
    const tipId = useId();
    const { t } = useTranslation();

    return (
        <button
            type="button"
            aria-label={t.common.aria.moreInfo}
            aria-describedby={tipId}
            className={`group/info relative cursor-help border-0 bg-transparent p-0 text-[1.1rem] text-text-muted transition hover:text-primary focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main${
                className ? ` ${className}` : ''
            }`}
        >
            <HelpCircle className="w-5 h-5" aria-hidden="true" />
            <span
                id={tipId}
                role="tooltip"
                className={`pointer-events-none absolute right-0 z-[200] w-[min(260px,calc(100vw-2rem))] rounded-md border border-border-strong bg-bg-card p-3 text-left font-[Outfit,sans-serif] text-[0.82rem] leading-snug font-normal text-text-main opacity-0 shadow-lg transition group-hover/info:opacity-100 group-focus-visible/info:opacity-100 ${
                    opensBelow
                        ? 'top-[calc(100%+8px)] group-hover/info:translate-y-0.5 group-focus-visible/info:translate-y-0.5'
                        : 'bottom-[calc(100%+10px)] group-hover/info:-translate-y-0.5 group-focus-visible/info:-translate-y-0.5'
                }`}
            >
                {text}
            </span>
        </button>
    );
}
