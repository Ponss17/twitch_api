import { useState, type ComponentType } from 'react';
import { Bell, Download, Sparkles, X } from 'lucide-react';
import { logout } from '@/core/api/auth';
import { useTranslation } from '@/core/i18n/I18nContext';
import {
    Dropdown,
    DropdownPanel,
    DropdownTrigger,
    useDropdown
} from '@/shared/ui/Dropdown';
import { useAnnouncements } from './useAnnouncements';
import type { AnnouncementDef, AnnouncementIcon, AnnouncementId } from './announcements';

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

interface PanelBodyProps {
    announcements: AnnouncementDef[];
    count: number;
    dismiss: (id: AnnouncementId) => void;
    dismissAll: () => void;
}

function NotificationsPanelBody({ announcements, count, dismiss, dismissAll }: PanelBodyProps) {
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
                {announcements.length === 0 ? (
                    <p className="px-3 py-7 text-center text-[0.75rem] text-text-muted">
                        {aT.emptyBody}
                    </p>
                ) : (
                    <ul className="flex flex-col">
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
                        onClick={dismissAll}
                        className="w-full rounded-lg px-2 py-1.5 text-center text-[0.7rem] font-medium text-text-muted transition hover:bg-white/[0.02] hover:text-text-main"
                    >
                        {aT.markAllRead}
                    </button>
                </footer>
            )}
        </>
    );
}

export function NotificationsBell() {
    const { t } = useTranslation();
    const aT = t.announcements;
    const { announcements, count, dismiss, dismissAll } = useAnnouncements();

    return (
        <Dropdown>
            <DropdownTrigger
                aria-label={aT.bellLabel}
                className="relative flex size-9 items-center justify-center rounded-xl border border-border-subtle bg-bg-secondary text-text-muted transition-colors hover:border-border-strong hover:bg-white/[0.02] hover:text-text-main aria-expanded:border-border-strong aria-expanded:bg-white/[0.03] aria-expanded:text-text-main"
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
                <NotificationsPanelBody
                    announcements={announcements}
                    count={count}
                    dismiss={dismiss}
                    dismissAll={dismissAll}
                />
            </DropdownPanel>
        </Dropdown>
    );
}
