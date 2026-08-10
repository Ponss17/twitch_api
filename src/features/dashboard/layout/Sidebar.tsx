import { useEffect, useRef } from 'react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import type { DashboardTab } from '@/core/config/config';
import { appPath, saveDocsReturnPath } from '@/core/config/paths';
import { NAV_ITEMS } from '@/features/dashboard/lib/dashboardTabs';
import {
    sidebarBackdrop,
    sidebarBrandHeader,
    sidebarNavItem,
    sidebarNavScroll,
    sidebarShell,
    hoverSubtleNav,
    APP_BOTTOM_BAR
} from '@/core/utils/tw';
import { DiscordIcon } from '@/shared/ui/icons/BrandIcons';
import { AppLogo } from '@/shared/ui/AppLogo';
import { IconMd } from '@/shared/ui/Icon';
import { Book, MessageSquare } from 'lucide-react';
import { useTranslation } from '@/core/i18n/I18nContext';

interface SidebarProps {
    active: DashboardTab;
    onChange: (tab: DashboardTab) => void;
    mobileOpen: boolean;
    onClose: () => void;
}

const MAIN_NAV = NAV_ITEMS.filter((item) => item.category !== 'support');

const supportIconBtn =
    `inline-flex h-full min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-transparent px-1 py-1.5 text-[0.65rem] font-medium leading-none text-text-muted no-underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 ${hoverSubtleNav}`;

export function Sidebar({ active, onChange, mobileOpen, onClose }: SidebarProps) {
    const { t } = useTranslation();
    const asideRef = useRef<HTMLElement>(null);
    const feedbackActive = active === 'feedback';

    // Cerrado en móvil: no debe recibir foco (queda fuera de pantalla).
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

                <div className={`${APP_BOTTOM_BAR} flex items-center px-2.5`}>
                    <div
                        className="grid h-full w-full grid-cols-3 gap-1 py-1"
                        role="group"
                        aria-label={t.sidebar.categories.support}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                onChange('feedback');
                                onClose();
                            }}
                            className={`${supportIconBtn} ${
                                feedbackActive ? 'border-primary/25 bg-primary/15 text-primary' : ''
                            }`}
                            aria-label={t.sidebar.items.feedback}
                            aria-current={feedbackActive ? 'page' : undefined}
                            title={t.sidebar.items.feedback}
                        >
                            <MessageSquare className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                            <span className="max-w-full truncate">{t.sidebar.items.feedback}</span>
                        </button>
                        <a
                            href={appPath('/docs')}
                            onClick={saveDocsReturnPath}
                            className={supportIconBtn}
                            aria-label={t.sidebar.docs}
                            title={t.sidebar.docs}
                        >
                            <Book className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                            <span className="max-w-full truncate">{t.sidebar.docs}</span>
                        </a>
                        <a
                            href="https://discord.gg/PJbExZe7Tp"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={supportIconBtn}
                            aria-label={t.sidebar.discord}
                            title={t.sidebar.discord}
                        >
                            <DiscordIcon className="size-4 shrink-0" aria-hidden />
                            <span className="max-w-full truncate">{t.sidebar.discord}</span>
                        </a>
                    </div>
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
