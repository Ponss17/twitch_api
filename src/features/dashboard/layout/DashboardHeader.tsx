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

const PAYPAL_URL = 'https://www.paypal.me/Ponssjean';

interface DashboardHeaderProps {
    tab: DashboardTab;
    onSettings: () => void;
    onLogout: () => void;
    onMenuToggle: () => void;
    mobileMenuOpen?: boolean;
}

export function DashboardHeader({
    tab,
    onSettings,
    onLogout,
    onMenuToggle,
    mobileMenuOpen = false
}: DashboardHeaderProps) {
    const session = useRequiredSession();
    const meta = TAB_META[tab];
    const displayName = session.displayName ?? session.login ?? 'Streamer';
    const twitchProfileUrl = session.login ? `https://www.twitch.tv/${session.login}` : '#';

    return (
        <header className="w-full pt-4">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 md:px-8 lg:px-12 xl:px-16">
                <button
                    type="button"
                    onClick={onMenuToggle}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 hover:bg-white/[0.05] hover:text-zinc-100 lg:hidden"
                    aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={mobileMenuOpen}
                    aria-controls="dashboard-sidebar"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <h1 className="flex flex-1 items-center gap-3 text-[1.4rem] font-semibold tracking-tight text-zinc-100 md:text-[1.6rem]">
                    {meta.title}
                </h1>

                <div className="flex items-center gap-2">
                    <Dropdown>
                        <DropdownTrigger
                            aria-label="Menú de cuenta"
                            className="group flex items-center gap-2.5 rounded-xl border border-white/[0.04] bg-bg-secondary py-1 pl-1 pr-3 transition-all hover:border-white/[0.08]"
                        >
                            <img
                                src={session.profile_image_url ?? staticPath('/img/logo.svg')}
                                alt=""
                                className="h-8 w-8 shrink-0 rounded-full border border-white/[0.04] object-cover ring-2 ring-transparent transition-all group-hover:ring-white/10"
                            />
                            <span className="hidden max-w-[120px] truncate text-[0.85rem] font-medium text-zinc-300 transition-colors group-hover:text-zinc-100 md:inline">
                                {displayName}
                            </span>
                            <DropdownChevron className="hidden size-4 shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-300 md:block" />
                        </DropdownTrigger>

                        <DropdownPanel widthClassName="w-[230px]" zIndex={1000} className="rounded-2xl">
                            <DropdownHeader>Mi Cuenta</DropdownHeader>
                            <DropdownItem onClick={onSettings}>
                                <Settings className="w-4 text-center" />
                                Configuración
                            </DropdownItem>
                            <DropdownLink href={twitchProfileUrl} target="_blank" rel="noopener noreferrer">
                                <TwitchIcon className="w-4 text-center grayscale brightness-[200] opacity-70 group-hover:opacity-100 group-hover:brightness-[250] transition-all" />
                                Perfil de Twitch
                            </DropdownLink>
                            <DropdownLink href={PAYPAL_URL} target="_blank" rel="noopener noreferrer">
                                <Heart className="w-4 text-center" aria-hidden />
                                Apoyar el proyecto
                            </DropdownLink>
                            <DropdownDivider />
                            <DropdownItem variant="danger" onClick={onLogout}>
                                <LogOut className="w-4 text-center" />
                                Cerrar Sesión
                            </DropdownItem>
                        </DropdownPanel>
                    </Dropdown>
                </div>
            </div>
        </header>
    );
}
