import { useEffect, useRef } from 'react';
import type { DashboardTab } from '@/core/config/config';
import { appPath, saveDocsReturnPath } from '@/core/config/paths';
import { NAV_ITEMS } from '@/features/dashboard/lib/dashboardTabs';
import {
    sidebarBackdrop,
    sidebarBrandHeader,
    sidebarNavItem,
    sidebarNavScroll,
    sidebarShell,
    sidebarSupportLink
} from '@/core/utils/tw';
import { DiscordIcon } from '@/shared/ui/icons/BrandIcons';
import { AppLogo } from '@/shared/ui/AppLogo';
import { IconMd } from '@/shared/ui/Icon';
import { Book } from 'lucide-react';

interface SidebarProps {
    active: DashboardTab;
    onChange: (tab: DashboardTab) => void;
    mobileOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ active, onChange, mobileOpen, onClose }: SidebarProps) {
    let lastCategory = '';
    const asideRef = useRef<HTMLElement>(null);

    const supportLinkClass = `${sidebarSupportLink} underline decoration-[#52525b] underline-offset-[5px] hover:decoration-primary`;

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
                        alt="Logo"
                        className="h-12 w-12 rounded-lg object-contain"
                        draggable={false}
                    />
                    <span className="text-[1.1rem] font-bold text-[#fafafa]">
                        LosPerris<span className="text-[#9146ff]">API</span>
                    </span>
                </div>

                <nav className={sidebarNavScroll} aria-label="Navegación del panel">
                    {NAV_ITEMS.map((item) => {
                        const showCategory = item.category !== lastCategory;
                        if (item.category) lastCategory = item.category;
                        const isActive = active === item.id;

                        return (
                            <div key={item.id}>
                                {showCategory && (
                                    <p
                                        className={`mb-3 px-4 text-[0.75rem] font-bold uppercase tracking-[0.05em] text-[#71717a] ${
                                            item.id === NAV_ITEMS[0].id ? 'mt-2' : 'mt-8'
                                        }`}
                                    >
                                        {item.category}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange(item.id);
                                        onClose();
                                    }}
                                    className={sidebarNavItem(isActive)}
                                    aria-label={item.label}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <IconMd
                                        icon={item.icon}
                                        className={isActive ? 'animate-nav-icon-bounce text-white' : ''}
                                    />
                                    <span>{item.label}</span>
                                </button>
                            </div>
                        );
                    })}

                    <a
                        href={appPath('/docs')}
                        className={supportLinkClass}
                        onClick={saveDocsReturnPath}
                    >
                        <IconMd icon={Book} />
                        <span>Documentación</span>
                    </a>
                    <a
                        href="https://discord.gg/8uN3qY5E"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={supportLinkClass}
                    >
                        <DiscordIcon className="size-5 shrink-0" />
                        <span>Discord</span>
                    </a>
                </nav>
            </aside>

            {mobileOpen && (
                <button
                    type="button"
                    aria-label="Cerrar menú"
                    className={sidebarBackdrop}
                    onClick={onClose}
                />
            )}
        </>
    );
}
