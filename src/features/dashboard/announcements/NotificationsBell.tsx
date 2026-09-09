import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { Bell, Download, FileBarChart, Sparkles, X } from 'lucide-react';
import { logout } from '@/core/api/auth';
import { useTranslation, getBcp47 } from '@/core/i18n/I18nContext';
import { useRequiredSession } from '@/core/session/useSession';
import {
    Dropdown,
    DropdownPanel,
    DropdownTrigger,
    useDropdown
} from '@/shared/ui/dropdown/Dropdown';
import { useAnnouncements } from './useAnnouncements';
import type { AnnouncementDef, AnnouncementIcon, AnnouncementId } from './announcements';
import {
    ensureMonthlyReport,
    fetchServerNotifications,
    markAllServerNotificationsRead,
    markServerNotificationRead,
    type ServerNotification
} from '@/features/dashboard/reports/reportsApi';
import { navigateDashboard } from '@/features/dashboard/lib/tabs/dashboardPanelEvents';

const ICON_MAP: Record<AnnouncementIcon, ComponentType<{ className?: string }>> = {
    download: Download,
    sparkles: Sparkles
};

function announcementCopy(
    items: Record<string, { title: string; body: string }>,
    id: AnnouncementId
): { title: string; body: string } | null {
    return items[id] ?? null;
}

function formatMonthLabel(yearMonth: string, locale: string): string {
    const [y, m] = yearMonth.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, 1));
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
        date
    );
}

export function NotificationsBell() {
    const { t, locale } = useTranslation();
    const aT = t.announcements;
    const rT = t.reports;
    const session = useRequiredSession();
    const { announcements, count: announceCount, dismiss, dismissAll } = useAnnouncements();
    const [serverNotifications, setServerNotifications] = useState<ServerNotification[]>([]);
    const bcp47 = getBcp47(locale);

    const refreshServer = useCallback(async () => {
        try {
            await ensureMonthlyReport(session);
        } catch {
            /* ensure no debe bloquear la bandeja */
        }
        try {
            const data = await fetchServerNotifications(session);
            setServerNotifications(data.notifications);
        } catch {
            /* silencioso: campanita no debe romper el panel */
        }
    }, [session]);

    useEffect(() => {
        void refreshServer();
    }, [refreshServer]);

    const unreadServer = serverNotifications.filter((n) => !n.read_at);
    const count = announceCount + unreadServer.length;

    const onOpenReport = async (notification: ServerNotification) => {
        const yearMonth =
            typeof notification.payload?.yearMonth === 'string'
                ? notification.payload.yearMonth
                : null;
        try {
            await markServerNotificationRead(session, notification.id);
            setServerNotifications((prev) =>
                prev.map((n) =>
                    n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
                )
            );
        } catch {
            /* ignore */
        }
        if (yearMonth) {
            navigateDashboard('reports', { month: yearMonth });
        }
    };

    const onMarkAllServerRead = async () => {
        try {
            await markAllServerNotificationsRead(session);
            setServerNotifications((prev) =>
                prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
            );
        } catch {
            /* ignore */
        }
    };

    return (
        <Dropdown>
            <DropdownTrigger
                aria-label={aT.bellLabel}
                className="relative flex size-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/[0.02] hover:text-text-main aria-expanded:bg-white/[0.03] aria-expanded:text-text-main"
            >
                <Bell className="size-4" aria-hidden />
                {count > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-bold text-white">
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </DropdownTrigger>

            <DropdownPanel
                widthClassName="w-[min(100vw-1.5rem,17rem)]"
                zIndex={1000}
                className="rounded-2xl"
                role="dialog"
                aria-label={aT.bellLabel}
            >
                <BellPanel
                    announcements={announcements}
                    serverNotifications={serverNotifications}
                    count={count}
                    dismiss={dismiss}
                    dismissAll={dismissAll}
                    onOpenReport={(n) => void onOpenReport(n)}
                    onMarkAllServerRead={() => void onMarkAllServerRead()}
                    reportTitle={(month) =>
                        rT.notificationTitle.replace('{month}', formatMonthLabel(month, bcp47))
                    }
                    reportBody={rT.notificationBody}
                    openLabel={rT.openReport}
                />
            </DropdownPanel>
        </Dropdown>
    );
}

function BellPanel({
    announcements,
    serverNotifications,
    count,
    dismiss,
    dismissAll,
    onOpenReport,
    onMarkAllServerRead,
    reportTitle,
    reportBody,
    openLabel
}: {
    announcements: AnnouncementDef[];
    serverNotifications: ServerNotification[];
    count: number;
    dismiss: (id: AnnouncementId) => void;
    dismissAll: () => void;
    onOpenReport: (notification: ServerNotification) => void;
    onMarkAllServerRead: () => void;
    reportTitle: (month: string) => string;
    reportBody: string;
    openLabel: string;
}) {
    const { t } = useTranslation();
    const aT = t.announcements;
    const { close } = useDropdown();
    const [loggingOut, setLoggingOut] = useState<AnnouncementId | null>(null);

    const onRelogin = async (id: AnnouncementId) => {
        setLoggingOut(id);
        dismiss(id);
        try {
            await logout();
        } catch {
            setLoggingOut(null);
        }
    };

    const markAll = () => {
        dismissAll();
        onMarkAllServerRead();
    };

    return (
        <>
            <header className="flex shrink-0 items-center gap-2.5 border-b border-border-subtle px-3 py-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bg-secondary text-text-main">
                    <Bell className="size-3.5" aria-hidden />
                </div>
                <p className="min-w-0 flex-1 text-[0.8125rem] font-semibold text-text-main">
                    {count > 0 ? aT.countLabel.replace('{count}', String(count)) : aT.emptyTitle}
                </p>
                <button
                    type="button"
                    onClick={close}
                    className="rounded-md p-1 text-text-muted transition hover:bg-white/[0.04] hover:text-text-main"
                    aria-label={t.common.aria.close}
                >
                    <X className="size-3.5" aria-hidden />
                </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
                {announcements.length === 0 && serverNotifications.length === 0 ? (
                    <p className="px-3 py-7 text-center text-[0.75rem] text-text-muted">
                        {aT.emptyBody}
                    </p>
                ) : (
                    <ul className="flex flex-col">
                        {serverNotifications.map((item) => {
                            const yearMonth =
                                typeof item.payload?.yearMonth === 'string'
                                    ? item.payload.yearMonth
                                    : null;
                            const title = yearMonth
                                ? reportTitle(yearMonth)
                                : item.title || openLabel;
                            const unread = !item.read_at;
                            return (
                                <li
                                    key={item.id}
                                    className="border-b border-border-subtle/60 last:border-b-0"
                                >
                                    <div className="flex gap-2.5 px-3 py-3">
                                        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-text-muted">
                                            <FileBarChart className="size-3.5" aria-hidden />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-[0.8125rem] font-semibold leading-snug text-text-main">
                                                    {title}
                                                </p>
                                                {unread ? (
                                                    <span className="shrink-0 pt-0.5 text-[0.65rem] text-text-muted">
                                                        {aT.timeNew}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="mt-0.5 text-[0.75rem] leading-snug text-text-muted">
                                                {reportBody}
                                            </p>
                                            {yearMonth ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onOpenReport(item);
                                                        close();
                                                    }}
                                                    className="mt-1.5 text-left text-[0.7rem] font-semibold text-brand-text transition hover:underline"
                                                >
                                                    {openLabel}
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                        {announcements.map((item) => {
                            const copy = announcementCopy(aT.items, item.id);
                            if (!copy) return null;
                            const Icon = ICON_MAP[item.icon ?? 'sparkles'];

                            return (
                                <li
                                    key={item.id}
                                    className="border-b border-border-subtle/60 last:border-b-0"
                                >
                                    <div className="flex gap-2.5 px-3 py-3">
                                        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-text-muted">
                                            <Icon className="size-3.5" aria-hidden />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-[0.8125rem] font-semibold leading-snug text-text-main">
                                                    {copy.title}
                                                </p>
                                                <span className="shrink-0 pt-0.5 text-[0.65rem] text-text-muted">
                                                    {aT.timeNew}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-[0.75rem] leading-snug text-text-muted">
                                                {copy.body}
                                            </p>
                                            {item.requiresRelogin && (
                                                <button
                                                    type="button"
                                                    onClick={() => void onRelogin(item.id)}
                                                    disabled={loggingOut === item.id}
                                                    className="mt-1.5 text-left text-[0.7rem] font-semibold text-brand-text transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {loggingOut === item.id
                                                        ? aT.reloginLoading
                                                        : aT.reloginCta}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {count > 0 && (
                <footer className="shrink-0 border-t border-border-subtle px-3 py-2">
                    <button
                        type="button"
                        onClick={markAll}
                        className="w-full rounded-lg px-2 py-1.5 text-center text-[0.7rem] font-medium text-text-muted transition hover:bg-white/[0.02] hover:text-text-main"
                    >
                        {aT.markAllRead}
                    </button>
                </footer>
            )}
        </>
    );
}
