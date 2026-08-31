import { useEffect, useRef, useState } from 'react';
import type { DashboardTab } from '@/core/config/config';
import { staticPath } from '@/core/config/paths';
import { NAV_ITEMS } from '@/features/dashboard/lib/tabs/dashboardTabs';
import {
    sidebarBackdrop,
    sidebarBrandHeader,
    sidebarLabelClip,
    sidebarNavItem,
    sidebarNavScroll,
    sidebarShell,
    SIDEBAR_MOTION,
    hoverSubtleIconBtn
} from '@/core/utils/tw';
import { AppLogo } from '@/shared/ui/AppLogo';
import { IconMd } from '@/shared/ui/Icon';
import { Menu } from 'lucide-react';
import { useTranslation } from '@/core/i18n/I18nContext';
import { useRequiredSession } from '@/core/session/useSession';
import {
    Dropdown,
    DropdownTrigger
} from '@/shared/ui/dropdown/Dropdown';
import { SidebarAccountMenu } from './SidebarAccountMenu';

interface SidebarProps {
    active: DashboardTab;
    onChange: (tab: DashboardTab) => void;
    mobileOpen: boolean;
    onClose: () => void;
    onSettings: () => void;
    onLogout: () => void;
    /** Solo desktop: rail icon-only. */
    collapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
}

const MAIN_NAV = NAV_ITEMS.filter((item) => item.category !== 'support');

function useIsDesktopLg(): boolean {
    const [desktop, setDesktop] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false
    );

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const onChange = () => setDesktop(mq.matches);
        onChange();
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    return desktop;
}

export function Sidebar({
    active,
    onChange,
    mobileOpen,
    onClose,
    onSettings,
    onLogout,
    collapsed = false,
    onCollapsedChange
}: SidebarProps) {
    const { t } = useTranslation();
    const session = useRequiredSession();
    const asideRef = useRef<HTMLElement>(null);
    const isDesktop = useIsDesktopLg();
    const railCollapsed = collapsed && isDesktop;
    const displayName = session.displayName ?? session.login ?? 'Streamer';
    const loginLabel =
        session.login && session.login.toLowerCase() !== (session.displayName ?? '').toLowerCase()
            ? `@${session.login}`
            : '';
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

    const toggleCollapsed = () => {
        onCollapsedChange?.(!collapsed);
    };

    return (
        <>
            <aside
                ref={asideRef}
                id="dashboard-sidebar"
                className={sidebarShell(mobileOpen, railCollapsed)}
                data-collapsed={railCollapsed ? 'true' : 'false'}
            >
                <div className={sidebarBrandHeader(railCollapsed)}>
                    <div
                        className={`flex min-w-0 items-center gap-2.5 overflow-hidden transition-[opacity,max-width] ${SIDEBAR_MOTION} ${railCollapsed
                                ? 'pointer-events-none max-w-0 opacity-0'
                                : 'max-w-[9.5rem] opacity-100'
                            }`}
                        aria-hidden={railCollapsed}
                    >
                        <AppLogo className="pointer-events-none h-8 w-8 shrink-0 text-primary" />
                        <span className="whitespace-nowrap text-[1.05rem] font-bold leading-none text-text-main">
                            LosPerris
                            <span className="text-[color:var(--brand-text)]">API</span>
                        </span>
                    </div>
                    {onCollapsedChange ? (
                        <button
                            type="button"
                            className={`shrink-0 items-center justify-center rounded-lg text-text-muted ${hoverSubtleIconBtn} ${railCollapsed
                                    ? 'inline-flex size-10'
                                    : 'hidden size-8 lg:inline-flex'
                                }`}
                            aria-label={
                                railCollapsed ? t.sidebar.expandMenu : t.sidebar.collapseMenu
                            }
                            aria-expanded={!railCollapsed}
                            aria-controls="dashboard-sidebar"
                            onClick={toggleCollapsed}
                        >
                            <Menu className="size-4" aria-hidden />
                        </button>
                    ) : null}
                </div>

                <nav className={`${sidebarNavScroll} relative`} aria-label={t.sidebar.navigation}>
                    {MAIN_NAV.map((item, index) => {
                        const prevCategory = index > 0 ? MAIN_NAV[index - 1].category : '';
                        const isCategoryStart =
                            Boolean(item.category) && item.category !== prevCategory;
                        const isActive = active === item.id;

                        const catKey = item.category as keyof typeof t.sidebar.categories;
                        const itemKey = item.id as keyof typeof t.sidebar.items;
                        const itemLabel = t.sidebar.items[itemKey];

                        return (
                            <div key={item.id}>
                                {isCategoryStart ? (
                                    <>
                                        <p
                                            className={`overflow-hidden px-4 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted transition-[max-height,margin,opacity,padding] ${SIDEBAR_MOTION} ${railCollapsed
                                                    ? 'mb-0 mt-0 max-h-0 opacity-0'
                                                    : `mb-2 max-h-8 opacity-100 ${index === 0 ? 'mt-2' : 'mt-8'}`
                                                }`}
                                            aria-hidden={railCollapsed}
                                        >
                                            {item.category ? t.sidebar.categories[catKey] : ''}
                                        </p>
                                        {index > 0 ? (
                                            <div
                                                className={`mx-auto h-px w-5 bg-border-subtle transition-[margin,opacity] ${SIDEBAR_MOTION} ${railCollapsed
                                                        ? 'my-2.5 opacity-100'
                                                        : 'my-0 max-h-0 opacity-0'
                                                    }`}
                                                aria-hidden
                                            />
                                        ) : null}
                                    </>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange(item.id);
                                        onClose();
                                    }}
                                    className={`${sidebarNavItem(isActive, railCollapsed)} relative overflow-hidden`}
                                    aria-label={itemLabel}
                                    title={railCollapsed ? itemLabel : undefined}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <div
                                        className={`relative z-10 flex min-w-0 items-center transition-[gap] ${SIDEBAR_MOTION} ${railCollapsed ? 'gap-0' : 'gap-3'
                                            }`}
                                    >
                                        <IconMd
                                            icon={item.icon}
                                            className={`shrink-0 ${isActive ? 'text-primary' : ''}`}
                                        />
                                        <span className={sidebarLabelClip(railCollapsed)}>
                                            {itemLabel}
                                        </span>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </nav>

                <div
                    className={`relative flex h-[4.25rem] shrink-0 items-center overflow-visible border-t border-border-subtle transition-[padding,justify-content] ${SIDEBAR_MOTION} ${railCollapsed ? 'justify-center px-1.5' : 'px-2.5'
                        }`}
                >
                    <Dropdown
                        className={`relative overflow-visible transition-[width] ${SIDEBAR_MOTION} ${railCollapsed ? 'w-auto' : 'w-full'
                            }`}
                    >
                        <DropdownTrigger
                            aria-label={t.header.accountMenu}
                            title={railCollapsed ? displayName : undefined}
                            className={`group flex items-center rounded-xl border border-transparent text-left transition-[padding,gap,width] ${SIDEBAR_MOTION} hover:bg-white/[0.02] aria-expanded:border-border-subtle aria-expanded:bg-white/[0.03] ${railCollapsed
                                    ? 'justify-center gap-0 p-1.5'
                                    : 'w-full gap-2.5 px-2 py-2'
                                }`}
                        >
                            <img
                                src={avatarSrc}
                                alt=""
                                className="size-9 shrink-0 rounded-full object-cover ring-1 ring-border-subtle"
                            />
                            <span
                                className={`min-w-0 flex-1 overflow-hidden transition-[max-width,opacity] ${SIDEBAR_MOTION} ${railCollapsed
                                        ? 'max-w-0 opacity-0'
                                        : 'max-w-[9rem] opacity-100'
                                    }`}
                                aria-hidden={railCollapsed}
                            >
                                <span className="block truncate whitespace-nowrap text-[0.875rem] font-semibold text-text-main">
                                    {displayName}
                                </span>
                                {loginLabel ? (
                                    <span className="block truncate whitespace-nowrap text-[0.7rem] text-text-muted">
                                        {loginLabel}
                                    </span>
                                ) : null}
                            </span>
                        </DropdownTrigger>

                        <SidebarAccountMenu
                            railCollapsed={railCollapsed}
                            twitchProfileUrl={twitchProfileUrl}
                            t={t}
                            onSettings={onSettings}
                            onClose={onClose}
                            onLogout={onLogout}
                        />
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

