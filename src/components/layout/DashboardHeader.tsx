import { useEffect, useRef, useState } from 'react';
import type { DashboardTab } from '@/lib/config';
import { useRequiredSession } from '@/hooks/useSession';
import { staticPath } from '@/lib/paths';
import { TAB_META } from '@/lib/dashboardTabs';
import { User, ChevronDown, LogOut, LayoutDashboard } from 'lucide-react';

interface DashboardHeaderProps {
    tab: DashboardTab;
    onProfile: () => void;
    onLogout: () => void;
    onMenuToggle: () => void;
}

export function DashboardHeader({ tab, onProfile, onLogout, onMenuToggle }: DashboardHeaderProps) {
    const session = useRequiredSession();
    const [menuOpen, setMenuOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const meta = TAB_META[tab];
    const displayName = session.displayName ?? session.login ?? 'Streamer';
    const twitchProfileUrl = session.login ? `https://www.twitch.tv/${session.login}` : '#';

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };
        document.addEventListener('click', onDocClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('click', onDocClick);
            document.removeEventListener('keydown', onKey);
        };
    }, []);

    return (
        <header className="w-full border-b border-white/[0.08] bg-[#09090b]">
            <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between gap-4 px-4 md:px-6">
                <button
                    type="button"
                    onClick={onMenuToggle}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-[#a1a1aa] transition hover:bg-white/5 hover:text-white lg:hidden"
                    aria-label="Abrir menú"
                >
                    <i className="fa-solid fa-bars" />
                </button>

                <h1 className="flex flex-1 items-center gap-3 text-xl font-bold tracking-tight text-[#fafafa] md:text-[1.8rem]">
                    <i className={`fa-solid ${meta.icon} text-[1.2rem] text-[#9146ff] opacity-90`} aria-hidden />
                    {meta.title}
                </h1>

                <div ref={containerRef} className="relative flex items-center gap-4">
                    <a
                        href="https://www.paypal.me/Ponssjean"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden items-center gap-2 rounded-full border border-white/[0.05] bg-white/[0.03] px-3 py-1.5 text-[0.85rem] font-semibold text-[#a1a1aa] no-underline transition hover:-translate-y-px hover:border-[#0070ba]/20 hover:bg-[#0070ba]/[0.08] hover:text-[#fafafa] sm:flex"
                        title="Apoyar el proyecto"
                    >
                        <i className="fa-brands fa-paypal text-[#0070ba]" />
                        <span>Donación</span>
                    </a>

                    <button
                        type="button"
                        onClick={() => setMenuOpen((v) => !v)}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        aria-label="Menú de cuenta"
                        className="flex items-center gap-2 rounded-full border border-[#9146ff]/50 bg-white/[0.03] px-2 py-1.5 backdrop-blur-md transition hover:border-[#9146ff]"
                    >
                        <img
                            src={session.profile_image_url ?? staticPath('/img/logo.svg')}
                            alt=""
                            className="h-[34px] w-[34px] rounded-full border-2 border-[#9146ff]/50 object-cover"
                        />
                        <span className="hidden max-w-[120px] truncate text-sm font-semibold text-[#fafafa] md:inline">
                            {displayName}
                        </span>
                        <ChevronDown className="w-4 h-4 text-[#71717a]" />
                    </button>

                    {menuOpen && (
                        <div
                            role="menu"
                            className="absolute right-0 top-[calc(100%+8px)] z-[1000] w-[230px] animate-fade-soft overflow-hidden rounded-2xl border border-[#9146ff]/20 bg-[rgba(15,15,20,0.92)] shadow-2xl backdrop-blur-xl"
                        >
                            <div className="border-b border-white/5 px-4 py-3">
                                <span className="text-xs font-bold uppercase tracking-wide text-[#71717a]">
                                    Mi Cuenta
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onProfile();
                                }}
                                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-[#a1a1aa] transition hover:bg-[#9146ff]/10 hover:text-[#fafafa]"
                            >
                                <User className="w-4 text-center" />
                                Mi Perfil
                            </button>
                            <a
                                href={twitchProfileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#a1a1aa] no-underline transition hover:bg-[#9146ff]/10 hover:text-[#fafafa]"
                            >
                                <i className="fa-brands fa-twitch w-4 text-center" />
                                Perfil de Twitch
                            </a>
                            <div className="my-1 border-t border-white/5" />
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onLogout();
                                }}
                                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-[#ef4444] transition hover:bg-[#ef4444]/10"
                            >
                                <i className="fa-solid fa-right-from-bracket w-4 text-center" />
                                Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
