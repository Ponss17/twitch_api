import type { DashboardTab } from '@/core/config/config';
import { isToolTab, TAB_META } from '@/features/dashboard/lib/tabs/dashboardTabs';
import { Maximize2, Menu } from 'lucide-react';
import { useTranslation } from '@/core/i18n/I18nContext';
import type { Translations } from '@/core/i18n/locales/es';
import { NotificationsBell } from '@/features/dashboard/announcements/NotificationsBell';
import { FeedbackWidget } from '@/features/dashboard/feedback/FeedbackWidget';
import { hoverSubtleIconBtn } from '@/core/utils/tw';

interface DashboardHeaderProps {
    tab: DashboardTab;
    onMenuToggle: () => void;
    mobileMenuOpen?: boolean;
    onEnterFocusMode?: () => void;
}

function getTabSubtitle(tab: string, t: Translations): string {
    const key = tab as keyof typeof t.header.subtitles;
    return t.header.subtitles[key] || t.header.subtitles.default;
}

export function DashboardHeader({
    tab,
    onMenuToggle,
    mobileMenuOpen = false,
    onEnterFocusMode
}: DashboardHeaderProps) {
    const { t } = useTranslation();
    const meta = TAB_META[tab];
    const tabKey = tab as keyof typeof t.sidebar.items;
    const showFocusToggle = Boolean(onEnterFocusMode) && isToolTab(tab);

    return (
        <header className="w-full pt-7">
            <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-8 lg:px-12 xl:px-16">
                <button
                    type="button"
                    onClick={onMenuToggle}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 hover:bg-text-main/5 hover:text-text-main lg:hidden"
                    aria-label={mobileMenuOpen ? t.header.closeMenu : t.header.openMenu}
                    aria-expanded={mobileMenuOpen}
                    aria-controls="dashboard-sidebar"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <div className="flex flex-1 flex-col justify-center">
                    <div className="flex items-center gap-2.5">
                        <meta.icon className="h-[1.3rem] w-[1.3rem] text-primary" />
                        <h1 className="text-[1.35rem] font-semibold tracking-tight text-text-main md:text-[1.5rem]">
                            {t.sidebar.items[tabKey] || meta.title}
                        </h1>
                    </div>
                    <p className="mt-1 hidden text-[0.85rem] text-text-muted md:block">
                        {getTabSubtitle(tab, t)}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {showFocusToggle ? (
                        <button
                            type="button"
                            onClick={onEnterFocusMode}
                            className={`inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-[0.8rem] font-medium text-text-muted transition-[transform,background-color] active:scale-[0.97] sm:px-3 ${hoverSubtleIconBtn}`}
                            aria-label={t.header.enterFocusMode}
                            title={t.header.enterFocusMode}
                        >
                            <Maximize2 className="size-4 shrink-0" aria-hidden />
                            <span className="hidden sm:inline">{t.header.enterFocusMode}</span>
                        </button>
                    ) : null}
                    <FeedbackWidget />
                    <NotificationsBell />
                </div>
            </div>
        </header>
    );
}
