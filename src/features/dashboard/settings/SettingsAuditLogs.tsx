import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import { SettingsRow } from '@/features/dashboard/settings/SettingsGroup';
import { useSettingsAuditLogs } from '@/features/dashboard/settings/useSettingsAuditLogs';
import {
    auditActionLabel,
    auditScopeDetail,
    formatAuditAbsoluteTime,
    formatAuditRelativeTime
} from '@/features/dashboard/lib/auditLogDisplay';
import { btnSecondary, hoverSubtleIconBtn } from '@/core/utils/tw';
import { Modal } from '@/shared/ui/Modal';
import { useTranslation } from '@/core/i18n/I18nContext';

const AUDIT_VIEWPORT_CLASS =
    'max-h-[min(22rem,50vh)] overflow-y-auto overscroll-contain [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar]:w-1.5';

interface SettingsAuditLogsProps {
    active: boolean;
    refreshEpoch: number;
    timezone?: string;
}

function AuditLogsSkeleton() {
    return (
        <div className={`${AUDIT_VIEWPORT_CLASS} flex flex-col gap-0`} aria-hidden>
            {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 border-b border-border-subtle py-3">
                    <div
                        className="h-3.5 animate-pulse rounded bg-text-main/5"
                        style={{ width: `${44 + (i % 3) * 12}%` }}
                    />
                    <div className="h-3 w-24 shrink-0 animate-pulse rounded bg-text-main/5" />
                </div>
            ))}
        </div>
    );
}

export function SettingsAuditLogs({ active, refreshEpoch, timezone }: SettingsAuditLogsProps) {
    const { t, locale } = useTranslation();
    const gT = t.settings.groups.auditLogs;
    const aT = t.settings.auditLogs;
    const [open, setOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { logs, page, pageCount, total, loading, error, goPrev, goNext } = useSettingsAuditLogs(
        active && open,
        refreshEpoch
    );

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [page, refreshEpoch]);

    const showPagination = !loading && !error && total > 0 && pageCount > 1;

    return (
        <>
            <SettingsRow
                icon={ScrollText}
                title={gT.title}
                description={gT.desc}
                control={
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className={`${btnSecondary} w-full min-w-[12.25rem] sm:w-auto`}
                    >
                        {aT.show}
                    </button>
                }
            />

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={gT.title}
                titleIconNode={null}
                footer={
                    showPagination ? (
                        <div className="flex w-full items-center justify-center gap-1">
                            <button
                                type="button"
                                aria-label={aT.prevPage}
                                disabled={page <= 1}
                                onClick={goPrev}
                                className={`flex h-8 w-8 items-center justify-center rounded-md text-text-muted disabled:opacity-30 ${hoverSubtleIconBtn}`}
                            >
                                <ChevronLeft className="h-4 w-4" aria-hidden />
                            </button>
                            <span className="min-w-[7.5rem] text-center text-[0.78rem] text-text-muted">
                                {aT.page(page, pageCount)}
                            </span>
                            <button
                                type="button"
                                aria-label={aT.nextPage}
                                disabled={page >= pageCount}
                                onClick={goNext}
                                className={`flex h-8 w-8 items-center justify-center rounded-md text-text-muted disabled:opacity-30 ${hoverSubtleIconBtn}`}
                            >
                                <ChevronRight className="h-4 w-4" aria-hidden />
                            </button>
                        </div>
                    ) : undefined
                }
            >
                <p className="mb-4 text-[0.85rem] leading-relaxed text-text-muted">{gT.desc}</p>

                {loading ? (
                    <AuditLogsSkeleton />
                ) : error ? (
                    <p className="py-10 text-center text-[0.85rem] text-text-muted">{aT.error}</p>
                ) : logs.length === 0 ? (
                    <p className="py-10 text-center text-[0.85rem] leading-relaxed text-text-muted">
                        {aT.empty}
                    </p>
                ) : (
                    <div className="min-w-0 overflow-hidden rounded-lg border border-border-subtle">
                        <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-border-subtle bg-bg-secondary px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-text-muted">
                            <span>{aT.action}</span>
                            <span className="text-right">{aT.when}</span>
                        </div>
                        <div ref={scrollRef} className={AUDIT_VIEWPORT_CLASS}>
                            <div className="divide-y divide-border-subtle">
                                {logs.map((row, index) => {
                                    const relative = formatAuditRelativeTime(row.createdAt, t);
                                    const absolute = formatAuditAbsoluteTime(
                                        row.createdAt,
                                        timezone,
                                        locale
                                    );
                                    const detail =
                                        row.action === 'stats_cleared'
                                            ? auditScopeDetail(row.scopes, t)
                                            : '';
                                    return (
                                        <div
                                            key={`${row.createdAt}-${row.action}-${index}`}
                                            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3"
                                        >
                                            <div className="min-w-0">
                                                <div className="truncate text-[0.875rem] font-medium text-text-main">
                                                    {auditActionLabel(row.action, t)}
                                                </div>
                                                {detail ? (
                                                    <div className="mt-0.5 truncate text-[0.75rem] text-text-muted">
                                                        {detail}
                                                    </div>
                                                ) : null}
                                            </div>
                                            <div className="shrink-0 whitespace-nowrap text-right">
                                                {relative ? (
                                                    <div className="text-[0.78rem] text-text-muted">
                                                        {relative}
                                                    </div>
                                                ) : null}
                                                {absolute ? (
                                                    <div className="text-[0.72rem] tabular-nums text-text-muted">
                                                        {absolute}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
