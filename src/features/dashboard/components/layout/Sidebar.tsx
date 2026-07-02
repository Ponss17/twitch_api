import type { DashboardTab } from '@/core/config/config';
import { appPath, saveDocsReturnPath } from '@/core/config/paths';
import { NAV_ITEMS } from '@/features/dashboard/lib/dashboardTabs';
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

    const navButtonBase =
        'relative mb-0.5 flex items-center gap-3 rounded-lg border border-transparent px-3.5 py-2 text-left font-[inherit] text-[0.9rem] font-semibold transition-all outline-none focus-visible:bg-[#18181b] focus-visible:text-[#fafafa] focus-visible:shadow-[0_0_0_2px_#9146ff]';

    const navButtonClass = (isActive: boolean) => {
        const width = isActive ? 'ml-3 w-[calc(100%-28px)]' : 'mx-auto w-[calc(100%-16px)]';
        if (isActive) {
            return `${navButtonBase} ${width} bg-[#18181b] text-[#fafafa] before:pointer-events-none before:absolute before:top-1/2 before:left-0 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-r before:bg-primary before:shadow-[0_0_8px_#9146ff] before:content-['']`;
        }
        return `${navButtonBase} ${width} text-[#c4c4cc] hover:bg-[#18181b] hover:text-[#fafafa]`;
    };

    const supportLinkClass = `${navButtonBase} mx-auto w-[calc(100%-16px)] text-[#c4c4cc] underline decoration-[#52525b] underline-offset-[5px] transition hover:bg-[#18181b] hover:text-[#fafafa] hover:decoration-[#9146ff]`;

    return (
        <>
            <aside
                className={`fixed left-0 top-0 z-[1000] flex h-screen w-[280px] flex-col border-r border-white/[0.08] bg-[#0a0a0c] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:translate-x-0 ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}
            >
                <div className="flex h-20 items-center gap-3 border-b border-white/[0.08] px-5 py-4">
                    <AppLogo
                        alt="Logo"
                        className="h-12 w-12 rounded-lg object-contain"
                        draggable={false}
                    />
                    <span className="text-[1.1rem] font-bold text-[#fafafa]">
                        LosPerris<span className="text-[#9146ff]">API</span>
                    </span>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-3">
                    {NAV_ITEMS.map((item) => {
                        const showCategory = item.category !== lastCategory;
                        if (item.category) lastCategory = item.category;
                        const isActive = active === item.id && item.id !== 'profile';

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
                                    className={navButtonClass(isActive)}
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
                    className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}
        </>
    );
}
