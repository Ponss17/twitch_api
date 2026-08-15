import type { DashboardTab } from '@/core/config/config';
import { useRequiredSession } from '@/core/session/useSession';
import { staticPath } from '@/core/config/paths';
import { TAB_META } from '@/features/dashboard/lib/dashboardTabs';
import {
    Dropdown,
    DropdownChevron,
    DropdownDivider,
    DropdownHeader,
    DropdownItem,
    DropdownLink,
    DropdownPanel,
    DropdownTrigger
} from '@/shared/ui/Dropdown';
import { Heart, LogOut, Menu, Settings } from 'lucide-react';
import { TwitchIcon } from '@/shared/ui/icons/BrandIcons';
import { useTranslation } from '@/core/i18n/I18nContext';
import type { Translations } from '@/core/i18n/locales/es';

const PAYPAL_URL = 'https://www.paypal.me/Ponssjean';

interface DashboardHeaderProps {
    tab: DashboardTab;
    onSettings: () => void;
    onLogout: () => void;
    onMenuToggle: () => void;
    mobileMenuOpen?: boolean;
}

function getTabSubtitle(tab: string, t: Translations): string {
    const key = tab as keyof typeof t.header.subtitles;
    return t.header.subtitles[key] || t.header.subtitles.default;
}

export function DashboardHeader({
    tab,
    onSettings,
    onLogout,
    onMenuToggle,
    mobileMenuOpen = false
}: DashboardHeaderProps) {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const meta = TAB_META[tab];
    const displayName = session.displayName ?? session.login ?? 'Streamer';
    const twitchProfileUrl = session.login ? `https://www.twitch.tv/${session.login}` : '#';
    const tabKey = tab as keyof typeof t.sidebar.items;

    return (
        <header className="w-full pt-3">
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
                    <Dropdown>
                        <DropdownTrigger
                            aria-label={t.header.accountMenu}
                            className="group flex items-center gap-3 rounded-[1.1rem] border border-border-subtle bg-bg-secondary py-1.5 pl-1.5 pr-4 transition-colors hover:border-primary/25 hover:bg-primary/[0.04] aria-expanded:border-primary/25 aria-expanded:bg-primary/[0.04]"
                        >
                            <img
                                src={session.profile_image_url?.replace('300x300', '70x70') ?? staticPath('/img/logo.svg')}
                                alt=""
                                className="h-9 w-9 shrink-0 rounded-full border border-transparent object-cover transition-colors group-hover:border-primary/25 group-aria-expanded:border-primary/25"
                            />
                            <span className="hidden max-w-[120px] truncate text-[0.9rem] font-medium text-text-main transition-colors group-hover:text-text-main group-aria-expanded:text-text-main md:inline">
                                {displayName}
                            </span>
                            <DropdownChevron className="hidden size-4 shrink-0 text-text-muted transition-colors group-hover:text-primary/70 group-aria-expanded:text-primary md:block" />
                        </DropdownTrigger>

                        <DropdownPanel widthClassName="w-[230px]" zIndex={1000} className="rounded-2xl">
                            <DropdownHeader>{t.header.myAccount}</DropdownHeader>
                            <DropdownItem onClick={onSettings}>
                                <Settings className="w-4 text-center" />
                                {t.header.settings}
                            </DropdownItem>
                            <DropdownLink href={twitchProfileUrl} target="_blank" rel="noopener noreferrer">
                                <TwitchIcon className="w-4 text-center opacity-70 group-hover:opacity-100 transition-all text-text-muted group-hover:text-primary" />
                                {t.header.twitchProfile}
                            </DropdownLink>
                            <DropdownLink href={PAYPAL_URL} target="_blank" rel="noopener noreferrer">
                                <Heart className="w-4 text-center" aria-hidden />
                                {t.header.supportProject}
                            </DropdownLink>
                            <DropdownDivider />
                            <DropdownItem variant="danger" onClick={onLogout}>
                                <LogOut className="w-4 text-center" />
                                {t.header.logout}
                            </DropdownItem>
                        </DropdownPanel>
                    </Dropdown>
                </div>
            </div>
        </header>
    );
}
