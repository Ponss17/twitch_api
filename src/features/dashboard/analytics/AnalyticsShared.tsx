import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { hoverSubtleIconBtn } from '@/core/utils/tw';

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

export const analyticsPanel =
    'rounded-xl border border-border-subtle bg-bg-panel shadow-[0_8px_30px_rgba(0,0,0,0.15)]';

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
        <section
            className={`${analyticsPanel} relative isolate flex min-h-0 flex-col overflow-hidden ${className} ${panelClassName}`}
        >
            <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-2.5">
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
                <p className="px-5 pt-2.5 text-[0.8125rem] leading-relaxed text-text-muted">{description}</p>
            ) : null}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-3 pt-2">{children}</div>
        </section>
    );
}

export function AnalyticsSimpleList({
    leftHeader,
    rightHeader,
    rows,
    empty,
    pageSize = 6,
    resetKey
}: {
    leftHeader: string;
    rightHeader: string;
    rows: Array<{ id: string; left: string; right: string; title?: string }>;
    empty: ReactNode;
    pageSize?: number;
    resetKey?: string | number;
}) {
    const [page, setPage] = useState(0);
    const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));

    useEffect(() => {
        setPage(0);
    }, [resetKey, pageSize]);

    useEffect(() => {
        if (page > pageCount - 1) setPage(Math.max(0, pageCount - 1));
    }, [page, pageCount]);

    if (rows.length === 0) return <>{empty}</>;

    const slice = rows.slice(page * pageSize, page * pageSize + pageSize);

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-2">
                <span className="text-[0.75rem] font-semibold text-text-muted">{leftHeader}</span>
                <span className="text-[0.75rem] font-semibold text-text-muted">{rightHeader}</span>
            </div>
            <ul className="min-h-0 flex-1">
                {slice.map((row) => (
                    <li
                        key={row.id}
                        className="flex items-center justify-between gap-4 border-b border-border-subtle/60 py-2.5 last:border-b-0"
                    >
                        <span
                            className="min-w-0 truncate text-[0.875rem] text-text-main"
                            title={row.title ?? row.left}
                        >
                            {row.left}
                        </span>
                        <span className="shrink-0 text-[0.875rem] tabular-nums text-text-muted">
                            {row.right}
                        </span>
                    </li>
                ))}
            </ul>
            <div className="mt-auto flex items-center justify-end gap-0.5 pt-2">
                <button
                    type="button"
                    aria-label="Previous page"
                    disabled={page <= 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-text-muted disabled:opacity-30 ${hoverSubtleIconBtn}`}
                >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <button
                    type="button"
                    aria-label="Next page"
                    disabled={page >= pageCount - 1}
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-text-muted disabled:opacity-30 ${hoverSubtleIconBtn}`}
                >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
            </div>
        </div>
    );
}

export function AnalyticsEmptyState({
    icon: Icon,
    title,
    description
}: {
    icon: LucideIcon;
    title: string;
    description: string;
}) {
    return (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center px-4 py-6 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                <Icon className="h-5 w-5 text-brand-text" aria-hidden />
            </div>
            <p className="text-[0.9375rem] font-semibold tracking-tight text-text-main">{title}</p>
            <p className="mt-1.5 max-w-[16rem] text-[0.8125rem] leading-relaxed text-text-muted">
                {description}
            </p>
        </div>
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
