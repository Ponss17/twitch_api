import React, { useEffect, useRef, useState, type ReactNode } from 'react';

export const COLORS = ['#7254b8', '#4a8b75', '#b3934d', '#b35656', '#4d75b3', '#b3714d', '#a85c87', '#615e9c'];

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
