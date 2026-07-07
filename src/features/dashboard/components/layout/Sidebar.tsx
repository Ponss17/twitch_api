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
} from '@/core/ui/tw';
import { DiscordIcon } from '@/shared/ui/icons/BrandIcons';
import { STATUS_PAGE_URL } from '@/core/config/config';
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

    const supportLinkClass = `${sidebarSupportLink} underline decoration-[#52525b] underline-offset-[5px] hover:decoration-primary`;

    return (
        <>
            <aside className={sidebarShell(mobileOpen)}>
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

                <nav className={sidebarNavScroll}>
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

                <div className="mt-auto px-4 pb-6 pt-4">
                    <a
                        href={STATUS_PAGE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between rounded-xl border border-white/5 bg-[#09090b] px-4 py-3 shadow-md transition hover:border-[#22c55e]/30 hover:bg-white/[0.02]"
                        title="Ver todos los sistemas operativos"
                    >
                        <span className="text-[0.75rem] font-medium text-[#a1a1aa] transition-colors group-hover:text-white">
                            Status del Sistema
                        </span>
                        <div className="relative flex h-2 w-2 items-center justify-center">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-60" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e]" />
                        </div>
                    </a>
                </div>
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
