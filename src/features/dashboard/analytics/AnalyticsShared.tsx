import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';

export const COLORS = ['#7254b8', '#4a8b75', '#b3934d', '#b35656', '#4d75b3', '#b3714d', '#a85c87', '#615e9c'];

/** Panel de analytics: borde suave, sin hover primary. */
export const analyticsPanel = 'rounded-xl border border-white/[0.06] bg-bg-card';

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
            <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
                <div className="min-w-0">
                    <h3 className="text-[0.9375rem] font-semibold tracking-tight text-[#fafafa]">{title}</h3>
                </div>
                {(action || info) ? (
                    <div className="flex shrink-0 items-center gap-2">
                        {action}
                        {info ? <InfoTooltip text={info} placement="bottom" /> : null}
                    </div>
                ) : null}
            </header>
            {description ? (
                <p className="px-5 pt-3 text-[0.8125rem] leading-relaxed text-[#8b8b93]">{description}</p>
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
