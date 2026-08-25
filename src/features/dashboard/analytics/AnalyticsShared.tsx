import { useEffect, useRef, useState, type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { SimpleEmptyState } from '@/shared/ui/SimpleEmptyState';
import { hoverSubtleIconBtn } from '@/core/utils/tw';
import { useTranslation } from '@/core/i18n/I18nContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
                    <h2 className="text-[0.9375rem] font-semibold tracking-tight text-text-main">
                        {title}
                    </h2>
                </div>
                {action || info ? (
                    <div className="flex shrink-0 items-center gap-2">
                        {action}
                        {info ? <InfoTooltip text={info} placement="bottom" /> : null}
                    </div>
                ) : null}
            </header>
            {description ? (
                <p className="px-5 pt-2 text-[0.8125rem] leading-relaxed text-text-muted">
                    {description}
                </p>
            ) : null}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-3 pt-2">
                {children}
            </div>
        </section>
    );
}

export function AnalyticsSimpleList({
    leftHeader,
    middleHeader,
    rightHeader,
    rows,
    empty,
    pageSize = 5,
    resetKey
}: {
    leftHeader: string;
    middleHeader?: string;
    rightHeader: string;
    rows: Array<{ id: string; left: string; middle?: string; right: string; title?: string }>;
    empty: ReactNode;
    pageSize?: number;
    resetKey?: string | number;
}) {
    const { t } = useTranslation();
    const [page, setPage] = useState(0);
    const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
    const hasMiddle = Boolean(middleHeader);

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
            <div
                className={`grid items-center gap-3 border-b border-border-subtle pb-2 ${
                    hasMiddle ? 'grid-cols-3' : 'grid-cols-[minmax(0,1fr)_auto]'
                }`}
            >
                <span className="min-w-0 text-[0.75rem] font-semibold text-text-muted">
                    {leftHeader}
                </span>
                {hasMiddle ? (
                    <span className="text-center text-[0.75rem] font-semibold text-text-muted">
                        {middleHeader}
                    </span>
                ) : null}
                <span
                    className={`text-[0.75rem] font-semibold text-text-muted ${
                        hasMiddle ? 'text-right' : 'justify-self-end'
                    }`}
                >
                    {rightHeader}
                </span>
            </div>
            <ul className="min-h-0 flex-1">
                {slice.map((row) => (
                    <li
                        key={row.id}
                        className={`grid items-center gap-3 border-b border-border-subtle/60 py-2 last:border-b-0 ${
                            hasMiddle ? 'grid-cols-3' : 'grid-cols-[minmax(0,1fr)_auto]'
                        }`}
                    >
                        <span
                            className="min-w-0 truncate text-[0.875rem] text-text-main"
                            title={row.title ?? row.left}
                        >
                            {row.left}
                        </span>
                        {hasMiddle ? (
                            <span className="text-center text-[0.875rem] tabular-nums text-text-muted">
                                {row.middle ?? '—'}
                            </span>
                        ) : null}
                        <span
                            className={`text-[0.875rem] tabular-nums text-text-muted ${
                                hasMiddle ? 'text-right' : 'justify-self-end'
                            }`}
                        >
                            {row.right}
                        </span>
                    </li>
                ))}
            </ul>
            <div className="mt-auto flex items-center justify-end gap-0.5 pt-2">
                <button
                    type="button"
                    aria-label={t.analytics.prevPage}
                    disabled={page <= 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-text-muted disabled:opacity-30 ${hoverSubtleIconBtn}`}
                >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <button
                    type="button"
                    aria-label={t.analytics.nextPage}
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
    icon,
    title,
    description
}: {
    icon: LucideIcon;
    title: string;
    description?: string;
}) {
    return (
        <SimpleEmptyState
            icon={icon}
            label={title}
            description={description}
            className="min-h-0 w-full flex-1 py-6"
        />
    );
}

export function AnalyticsSeriesLegend({
    requestsLabel,
    errorsLabel
}: {
    requestsLabel: string;
    errorsLabel: string;
}) {
    return (
        <div className="flex items-center gap-3 text-[0.7rem] font-medium text-text-muted">
            <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                {requestsLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-error" aria-hidden />
                {errorsLabel}
            </span>
        </div>
    );
}

/** Escala Y legible con pocos datos (evita eje 0–10 cuando el pico es 1). */
export function evenYAxis(dataMax: number): { max: number; ticks: number[] } {
    if (!Number.isFinite(dataMax) || dataMax <= 0) {
        return { max: 4, ticks: [0, 1, 2, 3, 4] };
    }
    if (dataMax <= 4) {
        return { max: 4, ticks: [0, 1, 2, 3, 4] };
    }
    let max = Math.ceil(dataMax * 1.12);
    if (max < 4) max = 4;
    while (max % 4 !== 0) max += 1;
    const step = max / 4;
    return {
        max,
        ticks: [0, step, step * 2, step * 3, max]
    };
}

/** Recharts pone tabindex en <g>; lo quitamos para a11y / auditorías. */
export function useStripRechartsTabIndex(enabled: boolean, deps: unknown[] = []) {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!enabled) return;
        const root = rootRef.current;
        if (!root) return;

        const strip = () => {
            root.querySelectorAll('.recharts-wrapper [tabindex], .recharts-surface [tabindex], g[tabindex]').forEach(
                (el) => {
                    el.removeAttribute('tabindex');
                }
            );
        };

        strip();
        const raf = requestAnimationFrame(strip);
        const t1 = window.setTimeout(strip, 50);
        const t2 = window.setTimeout(strip, 300);
        const mo = new MutationObserver(strip);
        mo.observe(root, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['tabindex']
        });

        return () => {
            cancelAnimationFrame(raf);
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            mo.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- deps explícitas del caller
    }, [enabled, ...deps]);

    return rootRef;
}
