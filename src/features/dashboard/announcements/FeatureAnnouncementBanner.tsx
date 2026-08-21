import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { logout } from '@/core/api/auth';
import { useTranslation } from '@/core/i18n/I18nContext';
import { btnSecondary, fadeIn, panelCard } from '@/core/utils/tw';
import { useAnnouncements } from './useAnnouncements';
import type { AnnouncementId, AnnouncementSurface } from './announcements';

function announcementCopy(
    items: Record<string, { title: string; body: string }>,
    id: AnnouncementId
): { title: string; body: string } | null {
    return items[id] ?? null;
}

export function FeatureAnnouncementBanner({ surface }: { surface: AnnouncementSurface }) {
    const { t } = useTranslation();
    const aT = t.announcements;
    const { announcements, dismiss } = useAnnouncements(surface);
    const [loggingOut, setLoggingOut] = useState<AnnouncementId | null>(null);

    if (announcements.length === 0) return null;

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
        <div className={`${fadeIn} mb-5 space-y-3`}>
            {announcements.map((item) => {
                const copy = announcementCopy(aT.items, item.id);
                if (!copy) return null;

                return (
                    <aside
                        key={item.id}
                        className={`${panelCard} relative overflow-hidden border-primary/25 bg-primary/[0.04] px-4 py-3.5 sm:px-5`}
                        role="status"
                        aria-label={copy.title}
                    >
                        <div className="flex gap-3">
                            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                                <Sparkles className="size-4" aria-hidden />
                            </div>

                            <div className="min-w-0 flex-1 pr-7">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[0.65rem] font-bold tracking-wider text-brand-text uppercase">
                                        {aT.badge}
                                    </span>
                                    <h3 className="text-[0.9375rem] font-semibold text-text-main">
                                        {copy.title}
                                    </h3>
                                </div>
                                <p className="text-[0.8125rem] leading-relaxed text-text-muted">
                                    {copy.body}
                                </p>

                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    {item.requiresRelogin && (
                                        <button
                                            type="button"
                                            onClick={() => void onRelogin(item.id)}
                                            disabled={loggingOut === item.id}
                                            className="inline-flex items-center justify-center rounded-lg bg-primary-btn px-3.5 py-1.5 text-[0.8125rem] font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {loggingOut === item.id
                                                ? aT.reloginLoading
                                                : aT.reloginCta}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => dismiss(item.id)}
                                        className={`${btnSecondary} px-3.5 py-1.5`}
                                    >
                                        {aT.dismiss}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => dismiss(item.id)}
                                className="absolute top-3 right-3 rounded-md p-1.5 text-text-muted transition hover:bg-white/[0.04] hover:text-text-main"
                                aria-label={aT.dismiss}
                            >
                                <X className="size-4" aria-hidden />
                            </button>
                        </div>
                    </aside>
                );
            })}
        </div>
    );
}
