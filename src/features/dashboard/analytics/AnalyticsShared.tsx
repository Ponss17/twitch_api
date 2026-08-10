import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { panelCard } from '@/core/utils/tw';

/** Paleta de charts: tokens por tema (`--chart-1`…`--chart-8` en themes.css). */
export const COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
    'var(--chart-6)',
    'var(--chart-7)',
    'var(--chart-8)'
];

/** Panel de analytics: estilo consistente con el dashboard (elevado) */
export const analyticsPanel = panelCard;

/** Estilo Nightbot: header dentro del panel (título + línea fina), contenido debajo. */
export function AnalyticsSection({
    title,
    description,
    info,
    action,
    className = '',
    panelClassName = '',
    children
}: {
    title: string;
    description?: string;
    info?: string;
    action?: ReactNode;
    className?: string;
    panelClassName?: string;
    children: ReactNode;
}) {
    return (
        <section className={`${analyticsPanel} flex min-h-0 flex-col ${className} ${panelClassName}`}>
            <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
                <div className="min-w-0">
                    <h2 className="text-[0.9375rem] font-semibold tracking-tight text-text-main">{title}</h2>
                </div>
                {(action || info) ? (
                    <div className="flex shrink-0 items-center gap-2">
                        {action}
                        {info ? <InfoTooltip text={info} placement="bottom" /> : null}
                    </div>
                ) : null}
            </header>
            {description ? (
                <p className="px-5 pt-3 text-[0.8125rem] leading-relaxed text-text-muted">{description}</p>
            ) : null}
            <div className="flex min-h-0 flex-1 flex-col p-5">{children}</div>
        </section>
    );
}

export function ChartMountGate({
    active,
    className,
    srLabel,
    children
}: {
    active: boolean;
    className?: string;
    srLabel?: string;
    children: ReactNode;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [canRender, setCanRender] = useState(false);

    useEffect(() => {
        if (!active) {
            setCanRender(false);
            return;
        }

        const node = containerRef.current;
        if (!node) return;

        const update = () => {
            const { width, height } = node.getBoundingClientRect();
            setCanRender(width > 0 && height > 0);
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(node);

        return () => observer.disconnect();
    }, [active]);

    return (
        <div ref={containerRef} className={className}>
            {srLabel ? <span className="sr-only">{srLabel}</span> : null}
            {canRender ? (
                <div aria-hidden="true" className="h-full w-full min-h-0 min-w-0">
                    {children}
                </div>
            ) : null}
        </div>
    );
}
