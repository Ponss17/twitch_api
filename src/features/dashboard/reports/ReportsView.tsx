import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Check, Download, FileBarChart, Terminal } from 'lucide-react';
import { useRequiredSession } from '@/core/session/useSession';
import { useTranslation, getBcp47 } from '@/core/i18n/I18nContext';
import {
    btnSecondary,
    fadeIn,
    hoverSubtleChip,
    panelCard,
    themeActiveChip,
    themeIdleChip
} from '@/core/utils/tw';
import { PanelLoadError } from '@/shared/ui/PanelLoadError';
import { ReportsSkeleton } from '@/shared/ui/skeletons/ReportsSkeleton';
import { navigateDashboard } from '@/features/dashboard/lib/tabs/dashboardPanelEvents';
import {
    ensureMonthlyReport,
    fetchMonthlyReport,
    fetchMonthlyReports,
    type MonthlyReportDetail,
    type MonthlyReportListItem
} from './reportsApi';
import {
    buildMonthlyReportCsv,
    buildMonthlyReportHtml,
    downloadTextFile
} from './reportDownload';

function readMonthFromUrl(): string | null {
    if (typeof window === 'undefined') return null;
    const month = new URLSearchParams(window.location.search).get('month');
    return month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : null;
}

function formatMonthLabel(yearMonth: string, locale: string): string {
    const [y, m] = yearMonth.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, 1));
    const raw = new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    }).format(date);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function formatMonthShort(yearMonth: string, locale: string): string {
    const [y, m] = yearMonth.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, 1));
    const raw = new Intl.DateTimeFormat(locale, {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
    }).format(date);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function padCount(n: number): string {
    return String(Math.max(0, n)).padStart(2, '0');
}

/**
 * Meses a la izquierda + detalle a la derecha, con chips/cards del panel
 * (primary, panelCard) — no el pill invertido tipo changelog externo.
 */
export function ReportsView({ active }: { active: boolean }) {
    const session = useRequiredSession();
    const { t, locale } = useTranslation();
    const bcp47 = getBcp47(locale);
    const rT = t.reports;
    const [list, setList] = useState<MonthlyReportListItem[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [detail, setDetail] = useState<MonthlyReportDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadList = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            try {
                await ensureMonthlyReport(session);
            } catch {
                /* listar igual si ensure falla (429/red/migración) */
            }
            const reports = await fetchMonthlyReports(session);
            setList(reports);
            const fromUrl = readMonthFromUrl();
            const initial =
                (fromUrl && reports.some((r) => r.yearMonth === fromUrl) ? fromUrl : null) ??
                reports[0]?.yearMonth ??
                null;
            setSelected(initial);
        } catch (e) {
            setError(e instanceof Error ? e.message : rT.loadError);
        } finally {
            setLoading(false);
        }
    }, [session, rT.loadError]);

    useEffect(() => {
        if (!active) return;
        void loadList();
    }, [active, loadList]);

    useEffect(() => {
        if (!active || !selected) {
            setDetail(null);
            return;
        }
        let cancelled = false;
        setDetailLoading(true);
        void fetchMonthlyReport(session, selected)
            .then((data) => {
                if (!cancelled) setDetail(data);
            })
            .catch((e) => {
                if (!cancelled) {
                    setDetail(null);
                    setError(e instanceof Error ? e.message : rT.loadError);
                }
            })
            .finally(() => {
                if (!cancelled) setDetailLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [active, selected, session, rT.loadError]);

    const latestYearMonth = list[0]?.yearMonth ?? null;
    const isLatest = Boolean(selected && latestYearMonth && selected === latestYearMonth);

    const monthLabel = useMemo(
        () => (selected ? formatMonthLabel(selected, bcp47) : rT.title),
        [selected, bcp47, rT.title]
    );

    const selectMonth = (yearMonth: string) => {
        setSelected(yearMonth);
        const url = new URL(window.location.href);
        url.searchParams.set('month', yearMonth);
        history.replaceState({}, '', `${url.pathname}${url.search}`);
    };

    const onDownloadCsv = () => {
        if (!detail) return;
        downloadTextFile(
            buildMonthlyReportCsv(detail.summary, {
                login: session.login ?? 'user',
                exportedAt: new Date().toISOString()
            }),
            `Reporte_${detail.yearMonth}_${session.login ?? 'user'}.csv`,
            'text/csv;charset=utf-8'
        );
    };

    const onDownloadHtml = () => {
        if (!detail) return;
        downloadTextFile(
            buildMonthlyReportHtml(detail.summary, {
                login: session.login ?? 'user',
                title: monthLabel,
                note: `${rT.intro} ${rT.note}`,
                exportedAt: new Date().toISOString()
            }),
            `Reporte_${detail.yearMonth}_${session.login ?? 'user'}.html`,
            'text/html;charset=utf-8'
        );
    };

    if (!active) return null;

    if (error && list.length === 0 && !loading) {
        return <PanelLoadError message={error} onRetry={() => void loadList()} />;
    }

    if (loading) return <ReportsSkeleton />;

    if (list.length === 0) {
        return (
            <div className={`${fadeIn} ${panelCard} px-6 py-12 text-center`}>
                <FileBarChart className="mx-auto mb-3 size-8 text-brand-text" aria-hidden />
                <p className="text-[1rem] font-semibold text-text-main">{rT.emptyTitle}</p>
                <p className="mx-auto mt-2 max-w-md text-[0.8125rem] leading-relaxed text-text-muted">
                    {rT.emptyBody}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigateDashboard('analytics')}
                        className={`${btnSecondary} inline-flex items-center gap-1.5`}
                    >
                        <BarChart3 className="size-3.5" aria-hidden />
                        {rT.emptyCtaAnalytics}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigateDashboard('followage')}
                        className={`${btnSecondary} inline-flex items-center gap-1.5`}
                    >
                        <Terminal className="size-3.5" aria-hidden />
                        {rT.emptyCtaCommands}
                    </button>
                </div>
            </div>
        );
    }

    const summary = detail?.summary;
    const busy = detailLoading || !summary;
    const topCommand = summary?.commands[0];
    const topViewer = summary?.topViewers[0];

    const highlights = summary
        ? [
              rT.checkUses.replace('{count}', String(summary.totalRequests)),
              rT.checkSuccess.replace('{rate}', String(summary.successRate)),
              rT.checkCommand.replace('{command}', topCommand?.name ?? rT.storyNoCommand),
              rT.checkViewer.replace('{viewer}', topViewer?.user_name ?? rT.storyNoViewer),
              rT.checkLatency.replace('{ms}', String(summary.avgLatencyMs))
          ]
        : [];

    return (
        <div className={`${fadeIn} grid gap-4 lg:grid-cols-[13.5rem_minmax(0,1fr)]`}>
            <aside className={`${panelCard} lg:sticky lg:top-4 lg:self-start`}>
                <p className="border-b border-border-subtle px-3.5 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wide text-text-muted">
                    {rT.browseByMonth}
                </p>
                <nav className="flex flex-col gap-0.5 p-1.5" aria-label={rT.months}>
                    {list.map((item) => {
                        const pressed = item.yearMonth === selected;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => selectMonth(item.yearMonth)}
                                aria-pressed={pressed}
                                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[0.8125rem] transition-colors ${
                                    pressed
                                        ? `${themeActiveChip} font-semibold text-brand-text`
                                        : `${themeIdleChip} font-medium ${hoverSubtleChip}`
                                }`}
                            >
                                <span className="min-w-0 truncate">
                                    {formatMonthShort(item.yearMonth, bcp47)}
                                </span>
                                <span
                                    className={`shrink-0 tabular-nums text-[0.7rem] ${
                                        pressed ? 'text-brand-text/80' : 'text-text-muted'
                                    }`}
                                >
                                    {padCount(item.totalRequests)}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </aside>

            <article className={`${panelCard} min-w-0 overflow-hidden`}>
                {busy ? (
                    <div className="space-y-4 px-5 py-6" aria-busy="true">
                        <div className="h-3 w-40 animate-pulse rounded bg-text-main/5" />
                        <div className="h-7 w-3/4 max-w-md animate-pulse rounded bg-text-main/5" />
                        <div className="h-14 w-full animate-pulse rounded bg-text-main/[0.04]" />
                        <div className="flex flex-wrap gap-3">
                            <div className="h-4 w-28 animate-pulse rounded bg-text-main/5" />
                            <div className="h-4 w-32 animate-pulse rounded bg-text-main/5" />
                            <div className="h-4 w-24 animate-pulse rounded bg-text-main/5" />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-[0.75rem] text-text-muted">
                                        {monthLabel}
                                        <span className="mx-1.5 text-text-muted/50">·</span>
                                        {rT.metaCategory}
                                    </p>
                                    {isLatest ? (
                                        <span className="rounded-md border border-primary/30 bg-primary/[0.08] px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-brand-text">
                                            {rT.latestBadge}
                                        </span>
                                    ) : null}
                                </div>
                                <h3 className="mt-1.5 text-[1.15rem] font-semibold tracking-tight text-text-main sm:text-[1.25rem]">
                                    {rT.entryTitle.replace('{month}', monthLabel)}
                                </h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={onDownloadHtml}
                                    className={`${btnSecondary} inline-flex items-center gap-1.5 !px-3 !py-1.5`}
                                >
                                    <Download className="size-3.5" aria-hidden />
                                    {rT.downloadHtml}
                                </button>
                                <button
                                    type="button"
                                    onClick={onDownloadCsv}
                                    className={`${btnSecondary} inline-flex items-center gap-1.5 !px-3 !py-1.5`}
                                >
                                    <Download className="size-3.5" aria-hidden />
                                    {rT.downloadCsv}
                                </button>
                            </div>
                        </div>

                        <div className="px-5 py-5">
                            <p className="max-w-2xl text-[0.875rem] leading-relaxed text-text-muted">
                                {summary.totalRequests <= 5
                                    ? summary.totalRequests === 1
                                        ? rT.lowActivityOne
                                        : rT.lowActivity.replace(
                                              '{count}',
                                              String(summary.totalRequests)
                                          )
                                    : rT.story
                                          .replace('{uses}', String(summary.totalRequests))
                                          .replace('{rate}', String(summary.successRate))
                                          .replace(
                                              '{command}',
                                              topCommand?.name ?? rT.storyNoCommand
                                          )
                                          .replace(
                                              '{viewer}',
                                              topViewer?.user_name ?? rT.storyNoViewer
                                          )}
                            </p>

                            <ul className="mt-4 flex flex-wrap gap-2">
                                {highlights.map((line) => (
                                    <li
                                        key={line}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-secondary px-2.5 py-1.5 text-[0.78rem] text-text-main"
                                    >
                                        <Check
                                            className="size-3.5 shrink-0 text-success"
                                            strokeWidth={2.5}
                                            aria-hidden
                                        />
                                        {line}
                                    </li>
                                ))}
                            </ul>

                            {(summary.commands.length > 0 || summary.topViewers.length > 0) && (
                                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                    <MiniRank
                                        title={rT.commands}
                                        empty={rT.noCommands}
                                        items={summary.commands.slice(0, 5).map((c) => ({
                                            name: c.name,
                                            meta: (c.requests === 1
                                                ? rT.commandUsesOne
                                                : rT.commandUses
                                            ).replace('{count}', String(c.requests))
                                        }))}
                                    />
                                    <MiniRank
                                        title={rT.topViewers}
                                        empty={rT.noViewers}
                                        items={summary.topViewers.slice(0, 5).map((v) => ({
                                            name: v.user_name,
                                            meta: (v.total === 1
                                                ? rT.viewerUsesOne
                                                : rT.viewerUses
                                            ).replace('{count}', String(v.total))
                                        }))}
                                    />
                                </div>
                            )}

                            <p className="mt-5 border-t border-border-subtle pt-4 text-[0.7rem] text-text-muted">
                                {rT.note}
                            </p>
                        </div>
                    </>
                )}
            </article>
        </div>
    );
}

function MiniRank({
    title,
    empty,
    items
}: {
    title: string;
    empty: string;
    items: Array<{ name: string; meta: string }>;
}) {
    return (
        <div className="rounded-xl border border-border-subtle bg-bg-secondary/60 p-3.5">
            <h4 className="text-[0.7rem] font-semibold uppercase tracking-wide text-text-muted">
                {title}
            </h4>
            {items.length === 0 ? (
                <p className="mt-2 text-[0.8rem] text-text-muted">{empty}</p>
            ) : (
                <ol className="mt-2 space-y-1.5">
                    {items.map((item, i) => (
                        <li
                            key={item.name}
                            className="flex items-baseline justify-between gap-2 text-[0.85rem]"
                        >
                            <span className="min-w-0 truncate text-text-main">
                                <span className="mr-1.5 tabular-nums text-text-muted">{i + 1}.</span>
                                {item.name}
                            </span>
                            <span className="shrink-0 text-[0.72rem] text-text-muted">{item.meta}</span>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}
