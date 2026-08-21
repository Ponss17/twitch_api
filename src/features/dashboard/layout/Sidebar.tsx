import { useEffect, useRef } from 'react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import type { DashboardTab } from '@/core/config/config';
import { appPath, saveDocsReturnPath, staticPath } from '@/core/config/paths';
import { NAV_ITEMS } from '@/features/dashboard/lib/dashboardTabs';
import {
    sidebarBackdrop,
    sidebarBrandHeader,
    sidebarNavItem,
    sidebarNavScroll,
    sidebarShell
} from '@/core/utils/tw';
import { DiscordIcon, TwitchIcon } from '@/shared/ui/icons/BrandIcons';
import { AppLogo } from '@/shared/ui/AppLogo';
import { IconMd } from '@/shared/ui/Icon';
import { Book, Heart, LogOut, MessageSquare, Settings } from 'lucide-react';
import { useTranslation } from '@/core/i18n/I18nContext';
import { useRequiredSession } from '@/core/session/useSession';
import {
    Dropdown,
    DropdownChevron,
    DropdownDivider,
    DropdownItem,
    DropdownLink,
    DropdownPanel,
    DropdownTrigger
} from '@/shared/ui/Dropdown';

const PAYPAL_URL = 'https://www.paypal.me/Ponssjean';

interface SidebarProps {
    active: DashboardTab;
    onChange: (tab: DashboardTab) => void;
    mobileOpen: boolean;
    onClose: () => void;
    onSettings: () => void;
    onLogout: () => void;
}

const MAIN_NAV = NAV_ITEMS.filter((item) => item.category !== 'support');

export function Sidebar({
    active,
    onChange,
    mobileOpen,
    onClose,
    onSettings,
    onLogout
}: SidebarProps) {
    const { t } = useTranslation();
    const session = useRequiredSession();
    const asideRef = useRef<HTMLElement>(null);
    const displayName = session.displayName ?? session.login ?? 'Streamer';
    const loginLabel = session.login ? `@${session.login}` : '';
    const twitchProfileUrl = session.login ? `https://www.twitch.tv/${session.login}` : '#';
    const avatarSrc =
        session.profile_image_url?.replace('300x300', '70x70') ?? staticPath('/img/logo.svg');

    useEffect(() => {
        const el = asideRef.current;
        if (!el) return;
        const applyInert = () => {
            const desktop = window.matchMedia('(min-width: 1024px)').matches;
            if (desktop || mobileOpen) {
                el.removeAttribute('inert');
                el.removeAttribute('aria-hidden');
            } else {
                el.setAttribute('inert', '');
                el.setAttribute('aria-hidden', 'true');
            }
        };
        applyInert();
        const mq = window.matchMedia('(min-width: 1024px)');
        mq.addEventListener('change', applyInert);
        return () => mq.removeEventListener('change', applyInert);
    }, [mobileOpen]);

    useEffect(() => {
        if (!mobileOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [mobileOpen, onClose]);

    return (
        <>
            <aside
                ref={asideRef}
                id="dashboard-sidebar"
                className={sidebarShell(mobileOpen)}
            >
                <div className={sidebarBrandHeader}>
                    <AppLogo
                        className="pointer-events-none h-9 w-9 shrink-0 text-primary transition-colors duration-300"
                    />
                    <span className="text-[1.1rem] font-bold text-text-main">
                        LosPerris<span className="text-[color:var(--brand-text)]">API</span>
                    </span>
                </div>

                <nav className={sidebarNavScroll} aria-label={t.sidebar.navigation}>
                    {MAIN_NAV.map((item, index) => {
                        const prevCategory = index > 0 ? MAIN_NAV[index - 1].category : '';
                        const showCategory = item.category && item.category !== prevCategory;
                        const isActive = active === item.id;

                        const catKey = item.category as keyof typeof t.sidebar.categories;
                        const itemKey = item.id as keyof typeof t.sidebar.items;

                        return (
                            <div key={item.id}>
                                {showCategory && (
                                    <p
                                        className={`mb-2 px-4 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted ${
                                            index === 0 ? 'mt-2' : 'mt-8'
                                        }`}
                                    >
                                        {item.category ? t.sidebar.categories[catKey] : ''}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange(item.id);
                                        onClose();
                                    }}
                                    className={`${sidebarNavItem(isActive)} relative overflow-hidden`}
                                    aria-label={t.sidebar.items[itemKey]}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    {isActive && (
                                        <LazyMotion features={domAnimation}>
                                            <m.div
                                                layoutId="sidebar-active"
                                                className="absolute inset-0 bg-primary/20"
                                                initial={false}
                                                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                            />
                                        </LazyMotion>
                                    )}
                                    <div className="relative z-10 flex items-center gap-3">
                                        <IconMd
                                            icon={item.icon}
                                            className={isActive ? 'animate-nav-icon-bounce text-primary' : ''}
                                        />
                                        <span>{t.sidebar.items[itemKey]}</span>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </nav>

                <div className="shrink-0 border-t border-border-subtle px-2.5 py-2">
                    <Dropdown className="relative w-full">
                        <DropdownTrigger
                            aria-label={t.header.accountMenu}
                            className="group flex w-full items-center gap-2.5 rounded-xl border border-transparent px-2 py-2 text-left transition-colors hover:bg-white/[0.02] aria-expanded:border-border-subtle aria-expanded:bg-white/[0.03]"
                        >
                            <img
                                src={avatarSrc}
                                alt=""
                                className="size-9 shrink-0 rounded-full object-cover"
                            />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[0.875rem] font-semibold text-text-main">
                                    {displayName}
                                </span>
                                {loginLabel && (
                                    <span className="block truncate text-[0.7rem] text-text-muted">
                                        {loginLabel}
                                    </span>
                                )}
                            </span>
                            <DropdownChevron className="size-4 shrink-0 text-text-muted transition-colors group-hover:text-text-main group-aria-expanded:text-text-main" />
                        </DropdownTrigger>

                        <DropdownPanel
                            align="left"
                            placement="top"
                            widthClassName="w-[220px]"
                            zIndex={1000}
                            className="rounded-2xl"
                            padding="compact"
                        >
                            <DropdownItem
                                onClick={() => {
                                    onSettings();
                                    onClose();
                                }}
                            >
                                <Settings className="w-4 text-center" />
                                {t.header.settings}
                            </DropdownItem>
                            <DropdownLink
                                href={twitchProfileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <TwitchIcon className="w-4 text-center text-text-muted opacity-70 transition-all group-hover:text-text-main group-hover:opacity-100" />
                                {t.header.twitchProfile}
                            </DropdownLink>
                            <DropdownLink href={PAYPAL_URL} target="_blank" rel="noopener noreferrer">
                                <Heart className="w-4 text-center" aria-hidden />
                                {t.header.supportProject}
                            </DropdownLink>
                            <DropdownDivider />
                            <DropdownItem
                                onClick={() => {
                                    onChange('feedback');
                                    onClose();
                                }}
                            >
                                <MessageSquare className="w-4 text-center" />
                                {t.sidebar.items.feedback}
                            </DropdownItem>
                            <DropdownLink href={appPath('/docs')} onClick={saveDocsReturnPath}>
                                <Book className="w-4 text-center" />
                                {t.sidebar.docs}
                            </DropdownLink>
                            <DropdownLink
                                href="https://discord.gg/PJbExZe7Tp"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <DiscordIcon className="w-4 text-center" aria-hidden />
                                {t.sidebar.discord}
                            </DropdownLink>
                            <DropdownDivider />
                            <DropdownItem variant="danger" onClick={onLogout}>
                                <LogOut className="w-4 text-center" />
                                {t.header.logout}
                            </DropdownItem>
                        </DropdownPanel>
                    </Dropdown>
                </div>
            </aside>

            {mobileOpen && (
                <button
                    type="button"
                    aria-label={t.header.closeMenu}
                    className={sidebarBackdrop}
                    onClick={onClose}
                />
            )}
        </>
    );
}
