import type { DashboardTab } from '@/core/config/config';
import { TAB_META } from '@/features/dashboard/lib/dashboardTabs';
import { Menu } from 'lucide-react';
import { useTranslation } from '@/core/i18n/I18nContext';
import type { Translations } from '@/core/i18n/locales/es';
import { NotificationsBell } from '@/features/dashboard/announcements/NotificationsBell';

interface DashboardHeaderProps {
    tab: DashboardTab;
    onMenuToggle: () => void;
    mobileMenuOpen?: boolean;
}

function getTabSubtitle(tab: string, t: Translations): string {
    const key = tab as keyof typeof t.header.subtitles;
    return t.header.subtitles[key] || t.header.subtitles.default;
}

export function DashboardHeader({
    tab,
    onMenuToggle,
    mobileMenuOpen = false
}: DashboardHeaderProps) {
    const { t } = useTranslation();
    const meta = TAB_META[tab];
    const tabKey = tab as keyof typeof t.sidebar.items;

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
                    <NotificationsBell />
                </div>
            </div>
        </header>
    );
}
