import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { DashboardTab } from '@/core/config/config';
import { staticPath } from '@/core/config/paths';
import { NAV_ITEMS, type NavItem } from '@/features/dashboard/lib/tabs/dashboardTabs';
import {
    COLLAPSIBLE_NAV_CATEGORIES,
    isCollapsibleNavCategory,
    readSidebarSectionsPref,
    writeSidebarSectionsPref,
    type CollapsibleNavCategory
} from '@/features/dashboard/lib/ui/sidebarPrefs';
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
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslation } from '@/core/i18n/I18nContext';
import { useRequiredSession } from '@/core/session/useSession';
import {
    Dropdown,
    DropdownTrigger,
    DropdownChevron
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

type NavGroup = { category: string; items: NavItem[] };

function groupMainNav(items: NavItem[]): NavGroup[] {
    const groups: NavGroup[] = [];
    for (const item of items) {
        const category = item.category ?? '';
        const last = groups[groups.length - 1];
        if (last && last.category === category) {
            last.items.push(item);
        } else {
            groups.push({ category, items: [item] });
        }
    }
    return groups;
}

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
    const navListRef = useRef<HTMLDivElement>(null);
    const navBtnRefs = useRef(new Map<DashboardTab, HTMLButtonElement | null>());
    const [navPill, setNavPill] = useState<{
        top: number;
        left: number;
        width: number;
        height: number;
    } | null>(null);
    const [openSections, setOpenSections] = useState(readSidebarSectionsPref);
    const isDesktop = useIsDesktopLg();
    const railCollapsed = collapsed && isDesktop;
    const navGroups = useMemo(() => groupMainNav(MAIN_NAV), []);
    const displayName = session.displayName ?? session.login ?? 'Streamer';
    const loginLabel =
        session.login && session.login.toLowerCase() !== (session.displayName ?? '').toLowerCase()
            ? `@${session.login}`
            : '';
    const twitchProfileUrl = session.login ? `https://www.twitch.tv/${session.login}` : '#';
    const avatarSrc =
        session.profile_image_url?.replace('300x300', '70x70') ?? staticPath('/img/logo.svg');

    const activeCategory = MAIN_NAV.find((item) => item.id === active)?.category;
    const sectionsKey = COLLAPSIBLE_NAV_CATEGORIES.map(
        (key) => `${key}:${openSections[key] ? 1 : 0}`
    ).join('|');

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

    // La ruta activa mantiene su grupo abierto (también en primer paint).
    useEffect(() => {
        if (!isCollapsibleNavCategory(activeCategory)) return;
        setOpenSections((prev) => {
            if (prev[activeCategory]) return prev;
            const next = { ...prev, [activeCategory]: true };
            writeSidebarSectionsPref(next);
            return next;
        });
    }, [activeCategory]);

    // `active` no va aquí: si cambia, la pastilla debe animar con CSS.
    // `sectionsKey` sí: abrir/cerrar un grupo mueve los botones.
    const layoutKey = `${railCollapsed}-${mobileOpen}-${isDesktop}-${sectionsKey}`;
    const prevLayoutKey = useRef(layoutKey);
    const [smoothPill, setSmoothPill] = useState(false);
    const activeInMainNav = MAIN_NAV.some((item) => item.id === active);

    const toggleCollapsed = () => {
        onCollapsedChange?.(!collapsed);
    };

    const toggleSection = (category: CollapsibleNavCategory) => {
        if (activeCategory === category) return;
        setOpenSections((prev) => {
            const next = { ...prev, [category]: !prev[category] };
            writeSidebarSectionsPref(next);
            return next;
        });
    };

    const isSectionOpen = (category: string): boolean => {
        if (railCollapsed) return true;
        if (!isCollapsibleNavCategory(category)) return true;
        if (activeCategory === category) return true;
        return openSections[category];
    };

    useLayoutEffect(() => {
        const measure = () => {
            const list = navListRef.current;
            if (!list) return;
            // Ajustes (y tabs fuera del nav) no tienen botón: quitar pastilla.
            if (!activeInMainNav) {
                setNavPill(null);
                return;
            }
            const btn = navBtnRefs.current.get(active);
            if (!btn) {
                setNavPill(null);
                return;
            }
            const listRect = list.getBoundingClientRect();
            const btnRect = btn.getBoundingClientRect();
            if (btnRect.width < 2 || btnRect.height < 2) return;
            setNavPill({
                top: btnRect.top - listRect.top,
                left: btnRect.left - listRect.left,
                width: btnRect.width,
                height: btnRect.height
            });
        };

        const layoutChanged = prevLayoutKey.current !== layoutKey;
        prevLayoutKey.current = layoutKey;

        let raf = 0;
        let settleTimer = 0;
        let followCancelled = false;

        if (layoutChanged) {
            // Sin ocultar la pastilla (evita parpadeo): seguir el layout frame a frame
            // sin transition CSS para que no quede una “franja” al colapsar.
            setSmoothPill(false);
            measure();
            const start = performance.now();
            const tick = (now: number) => {
                if (followCancelled) return;
                measure();
                if (now - start < 520) {
                    raf = requestAnimationFrame(tick);
                }
            };
            raf = requestAnimationFrame(tick);
            settleTimer = window.setTimeout(() => {
                measure();
            }, 520);
        } else {
            setSmoothPill(true);
            measure();
        }

        const ro = new ResizeObserver(measure);
        const list = navListRef.current;
        const aside = asideRef.current;
        if (list) ro.observe(list);
        if (aside) ro.observe(aside);
        navBtnRefs.current.forEach((el) => {
            if (el) ro.observe(el);
        });

        window.addEventListener('resize', measure);
        return () => {
            followCancelled = true;
            window.clearTimeout(settleTimer);
            cancelAnimationFrame(raf);
            ro.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [active, activeInMainNav, layoutKey]);

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
                        className={`flex min-w-0 items-center overflow-hidden transition-[gap] ${SIDEBAR_MOTION} ${
                            railCollapsed ? 'justify-center gap-0' : 'gap-2.5'
                        }`}
                    >
                        <AppLogo className="pointer-events-none h-8 w-8 shrink-0 text-primary" />
                        <span
                            className={`whitespace-nowrap text-[1.05rem] font-bold leading-none text-text-main transition-[max-width,opacity,margin] ${SIDEBAR_MOTION} ${
                                railCollapsed
                                    ? 'pointer-events-none m-0 max-w-0 opacity-0'
                                    : 'max-w-[9.5rem] opacity-100'
                            }`}
                            aria-hidden={railCollapsed}
                        >
                            LosPerris
                            <span className="text-[color:var(--brand-text)]">API</span>
                        </span>
                    </div>
                    {onCollapsedChange ? (
                        <button
                            type="button"
                            className={`hidden size-8 shrink-0 items-center justify-center rounded-lg text-text-muted lg:inline-flex ${hoverSubtleIconBtn}`}
                            aria-label={
                                railCollapsed ? t.sidebar.expandMenu : t.sidebar.collapseMenu
                            }
                            aria-expanded={!railCollapsed}
                            aria-controls="dashboard-sidebar"
                            onClick={toggleCollapsed}
                        >
                            {railCollapsed ? (
                                <PanelLeftOpen className="size-4" aria-hidden />
                            ) : (
                                <PanelLeftClose className="size-4" aria-hidden />
                            )}
                        </button>
                    ) : null}
                </div>

                <nav data-tour="sidebar-nav" className={sidebarNavScroll} aria-label={t.sidebar.navigation}>
                    <div ref={navListRef} className="relative">
                        {navPill ? (
                            <span
                                aria-hidden
                                className={`pointer-events-none absolute z-0 rounded-lg bg-primary/15 dark:bg-primary/20 dark:shadow-md dark:shadow-black/40 motion-reduce:transition-none ${
                                    smoothPill
                                        ? 'transition-[top,left,width,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'
                                        : ''
                                }`}
                                style={{
                                    top: navPill.top,
                                    left: navPill.left,
                                    width: navPill.width,
                                    height: navPill.height
                                }}
                            />
                        ) : null}
                        {navGroups.map((group, groupIndex) => {
                            const catKey = group.category as keyof typeof t.sidebar.categories;
                            const categoryLabel = group.category
                                ? t.sidebar.categories[catKey]
                                : '';
                            const collapsible = isCollapsibleNavCategory(group.category);
                            const isFlatTop = group.category === 'general';
                            const sectionOpen = isSectionOpen(group.category);
                            const panelId = group.category
                                ? `sidebar-section-${group.category}`
                                : undefined;
                            const prevCategory = groupIndex > 0 ? navGroups[groupIndex - 1]?.category : '';
                            const showExpandedDivider =
                                !railCollapsed &&
                                collapsible &&
                                prevCategory === 'general';

                            return (
                                <div key={group.category || `group-${groupIndex}`}>
                                    {groupIndex > 0 && railCollapsed ? (
                                        <div
                                            className={`mx-auto my-2.5 h-px w-5 bg-border-subtle transition-[margin,opacity] ${SIDEBAR_MOTION}`}
                                            aria-hidden
                                        />
                                    ) : null}
                                    {showExpandedDivider ? (
                                        <div
                                            className="mx-3 mb-2 mt-3 h-px bg-border-subtle"
                                            aria-hidden
                                        />
                                    ) : null}
                                    {collapsible && !railCollapsed ? (
                                        <button
                                            type="button"
                                            className={`mb-1 flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted transition-colors ${hoverSubtleIconBtn} ${
                                                showExpandedDivider || groupIndex === 0
                                                    ? 'mt-1'
                                                    : 'mt-5'
                                            }`}
                                            aria-expanded={sectionOpen}
                                            aria-controls={panelId}
                                            aria-label={
                                                sectionOpen
                                                    ? t.sidebar.collapseSection(categoryLabel)
                                                    : t.sidebar.expandSection(categoryLabel)
                                            }
                                            onClick={() =>
                                                toggleSection(
                                                    group.category as CollapsibleNavCategory
                                                )
                                            }
                                        >
                                            <span>{categoryLabel}</span>
                                            <ChevronDown
                                                className={`size-3.5 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                                    sectionOpen ? 'rotate-0' : '-rotate-90'
                                                }`}
                                                aria-hidden
                                            />
                                        </button>
                                    ) : null}

                                    <div
                                        id={panelId}
                                        role={collapsible ? 'region' : undefined}
                                        aria-label={collapsible ? categoryLabel : undefined}
                                        aria-hidden={
                                            collapsible && !railCollapsed && !sectionOpen
                                                ? true
                                                : undefined
                                        }
                                        className={
                                            collapsible && !railCollapsed
                                                ? `grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                                                      sectionOpen
                                                          ? 'grid-rows-[1fr]'
                                                          : 'grid-rows-[0fr]'
                                                  }`
                                                : undefined
                                        }
                                    >
                                        <div
                                            className={
                                                collapsible && !railCollapsed
                                                    ? 'min-h-0 overflow-hidden border-l border-border-subtle ml-3.5 pl-1'
                                                    : isFlatTop && !railCollapsed
                                                      ? 'mt-1'
                                                      : undefined
                                            }
                                        >
                                            {group.items.map((item) => {
                                                const isActive = active === item.id;
                                                const itemKey =
                                                    item.id as keyof typeof t.sidebar.items;
                                                const itemLabel = t.sidebar.items[itemKey];
                                                const inertSection =
                                                    collapsible && !railCollapsed && !sectionOpen;

                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        ref={(el) => {
                                                            navBtnRefs.current.set(item.id, el);
                                                        }}
                                                        tabIndex={inertSection ? -1 : undefined}
                                                        onClick={() => {
                                                            onChange(item.id);
                                                            onClose();
                                                        }}
                                                        className={`${sidebarNavItem(isActive, railCollapsed, Boolean(navPill))} relative z-[1]`}
                                                        aria-label={itemLabel}
                                                        title={
                                                            railCollapsed ? itemLabel : undefined
                                                        }
                                                        aria-current={
                                                            isActive ? 'page' : undefined
                                                        }
                                                    >
                                                        <div
                                                            className={`relative z-10 flex min-w-0 items-center transition-[gap] ${SIDEBAR_MOTION} ${
                                                                railCollapsed ? 'gap-0' : 'gap-3'
                                                            }`}
                                                        >
                                                            <IconMd
                                                                icon={item.icon}
                                                                className={`shrink-0 ${isActive ? 'text-primary' : ''}`}
                                                            />
                                                            <span
                                                                className={sidebarLabelClip(
                                                                    railCollapsed
                                                                )}
                                                            >
                                                                {itemLabel}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </nav>

                <div
                    className={`relative shrink-0 overflow-visible border-t border-border-subtle transition-[padding] ${SIDEBAR_MOTION} ${
                        railCollapsed ? 'px-1.5' : 'px-0'
                    }`}
                >
                    <Dropdown
                        className={`relative overflow-visible transition-[width] ${SIDEBAR_MOTION} ${
                            railCollapsed ? 'w-auto' : 'w-full'
                        }`}
                    >
                        <DropdownTrigger
                            aria-label={t.header.accountMenu}
                            title={railCollapsed ? displayName : undefined}
                            className={`group flex w-full items-center text-left transition-colors ${SIDEBAR_MOTION} hover:bg-white/[0.02] aria-expanded:bg-white/[0.03] ${
                                railCollapsed
                                    ? 'justify-center gap-0 px-0 py-3'
                                    : 'gap-2.5 px-3.5 py-3'
                            }`}
                        >
                            <img
                                src={avatarSrc}
                                alt=""
                                className="size-9 shrink-0 rounded-full object-cover"
                            />
                            <span
                                className={`min-w-0 flex-1 overflow-hidden transition-[max-width,opacity] ${SIDEBAR_MOTION} ${
                                    railCollapsed
                                        ? 'max-w-0 opacity-0'
                                        : 'max-w-[9rem] opacity-100'
                                }`}
                                aria-hidden={railCollapsed}
                            >
                                <span className="block truncate whitespace-nowrap text-[0.8125rem] font-semibold tracking-tight text-text-main">
                                    {displayName}
                                </span>
                                {loginLabel ? (
                                    <span className="block truncate whitespace-nowrap text-[0.65rem] text-text-muted">
                                        {loginLabel}
                                    </span>
                                ) : null}
                            </span>
                            <DropdownChevron
                                className={`size-3.5 shrink-0 text-text-muted transition-[opacity,transform,margin] ${SIDEBAR_MOTION} group-hover:text-text-main ${
                                    railCollapsed ? 'm-0 max-w-0 opacity-0' : 'opacity-100'
                                }`}
                            />
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
