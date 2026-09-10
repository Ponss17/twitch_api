import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, FileBarChart, Terminal } from 'lucide-react';
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
import { ReportsSkeleton, ReportsArticleSkeleton } from '@/shared/ui/skeletons/ReportsSkeleton';
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

/**
 * Archivo de meses cerrados (carta/informe), no panel de métricas en vivo.
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

    const storyText = summary
        ? summary.totalRequests <= 5
            ? summary.totalRequests === 1
                ? rT.lowActivityOne
                : rT.lowActivity.replace('{count}', String(summary.totalRequests))
            : rT.story
                  .replace('{uses}', String(summary.totalRequests))
                  .replace('{rate}', String(summary.successRate))
                  .replace('{command}', topCommand?.name ?? rT.storyNoCommand)
                  .replace('{viewer}', topViewer?.user_name ?? rT.storyNoViewer)
        : '';

    const vsPreviousText = (() => {
        if (!summary?.previous) return null;
        const prevLabel = formatMonthLabel(summary.previous.yearMonth, bcp47);
        const delta = summary.previous.requestsDelta;
        if (delta > 0) {
            return rT.vsPreviousUp
                .replace('{month}', prevLabel)
                .replace('{delta}', String(delta));
        }
        if (delta < 0) {
            return rT.vsPreviousDown
                .replace('{month}', prevLabel)
                .replace('{delta}', String(Math.abs(delta)));
        }
        return rT.vsPrevious.replace('{month}', prevLabel).replace('{delta}', '0');
    })();

    return (
        <div className={`${fadeIn} grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)]`}>
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
                                className={`w-full rounded-lg px-2.5 py-2 text-left text-[0.8125rem] transition-colors ${
                                    pressed
                                        ? `${themeActiveChip} font-semibold text-brand-text`
                                        : `${themeIdleChip} font-medium ${hoverSubtleChip}`
                                }`}
                            >
                                <span className="block truncate">
                                    {formatMonthShort(item.yearMonth, bcp47)}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </aside>

            <article className={`${panelCard} min-w-0 overflow-hidden`}>
                {busy ? (
                    <div aria-busy="true">
                        <ReportsArticleSkeleton />
                    </div>
                ) : (
                    <>
                        <div className="border-b border-border-subtle px-5 py-5 sm:px-7">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[0.7rem] font-medium uppercase tracking-wide text-text-muted">
                                    {rT.eyebrow}
                                </p>
                                {isLatest ? (
                                    <span className="rounded-md border border-primary/30 bg-primary/[0.08] px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-brand-text">
                                        {rT.latestBadge}
                                    </span>
                                ) : null}
                            </div>
                            <h3 className="mt-2 text-[1.35rem] font-semibold tracking-tight text-text-main sm:text-[1.5rem]">
                                {rT.entryTitle.replace('{month}', monthLabel)}
                            </h3>
                            <p className="mt-1 text-[0.78rem] text-text-muted">
                                {monthLabel}
                                <span className="mx-1.5 text-text-muted/50">·</span>
                                {rT.metaCategory}
                            </p>
                        </div>

                        <div className="px-5 py-6 sm:px-7">
                            <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-text-muted">
                                {rT.storyTitle}
                            </p>
                            <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-text-main">
                                {storyText}
                            </p>
                            {vsPreviousText ? (
                                <p className="mt-3 text-[0.8125rem] text-text-muted">{vsPreviousText}</p>
                            ) : null}

                            {(summary.commands.length > 0 || summary.topViewers.length > 0) && (
                                <div className="mt-8 space-y-6 border-t border-border-subtle pt-6">
                                    <ReportDetailList
                                        title={rT.commands}
                                        hint={rT.commandsHint}
                                        empty={rT.noCommands}
                                        items={summary.commands.slice(0, 5).map((c) => ({
                                            name: c.name,
                                            meta: (c.requests === 1
                                                ? rT.commandUsesOne
                                                : rT.commandUses
                                            ).replace('{count}', String(c.requests))
                                        }))}
                                    />
                                    <ReportDetailList
                                        title={rT.topViewers}
                                        hint={rT.topViewersHint}
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

                            <div className="mt-8 border-t border-border-subtle pt-5">
                                <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-text-muted">
                                    {rT.downloadTitle}
                                </p>
                                <p className="mt-1 max-w-xl text-[0.78rem] text-text-muted">
                                    {rT.downloadHtmlDesc} {rT.downloadCsvDesc}
                                </p>
                                <div className="mt-3 grid max-w-md grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={onDownloadHtml}
                                        className={`${btnSecondary} inline-flex w-full items-center justify-center gap-1.5 !px-3 !py-2`}
                                    >
                                        <Download className="size-3.5 shrink-0" aria-hidden />
                                        {rT.downloadHtml}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onDownloadCsv}
                                        className={`${btnSecondary} inline-flex w-full items-center justify-center gap-1.5 !px-3 !py-2`}
                                    >
                                        <Download className="size-3.5 shrink-0" aria-hidden />
                                        {rT.downloadCsv}
                                    </button>
                                </div>
                                <p className="mt-4 text-[0.7rem] leading-relaxed text-text-muted">
                                    {rT.note}
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </article>
        </div>
    );
}

function ReportDetailList({
    title,
    hint,
    empty,
    items
}: {
    title: string;
    hint: string;
    empty: string;
    items: Array<{ name: string; meta: string }>;
}) {
    return (
        <div>
            <h4 className="text-[0.8rem] font-semibold text-text-main">{title}</h4>
            <p className="mt-0.5 text-[0.72rem] text-text-muted">{hint}</p>
            {items.length === 0 ? (
                <p className="mt-2 text-[0.8rem] text-text-muted">{empty}</p>
            ) : (
                <ol className="mt-3 space-y-2">
                    {items.map((item, i) => (
                        <li
                            key={item.name}
                            className="flex items-baseline justify-between gap-3 border-b border-border-subtle/70 pb-2 text-[0.85rem] last:border-0 last:pb-0"
                        >
                            <span className="min-w-0 truncate text-text-main">
                                <span className="mr-2 tabular-nums text-text-muted">{i + 1}.</span>
                                {item.name}
                            </span>
                            <span className="shrink-0 text-[0.75rem] text-text-muted">{item.meta}</span>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}
