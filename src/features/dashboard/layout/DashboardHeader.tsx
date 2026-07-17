import type { DashboardTab } from '@/core/config/config';
import { useRequiredSession } from '@/core/session/useSession';
import { staticPath } from '@/core/config/paths';
import { TAB_META } from '@/features/dashboard/lib/dashboardTabs';
import { IconLg } from '@/shared/ui/Icon';
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
import { hoverSubtleControl } from '@/core/utils/tw';

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
        <header className="w-full border-b border-white/[0.08] bg-[#09090b]">
            <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between gap-4 px-4 md:px-6">
                <button
                    type="button"
                    onClick={onMenuToggle}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-[#c4c4cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 lg:hidden ${hoverSubtleControl} hover:text-[#fafafa]`}
                    aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={mobileMenuOpen}
                    aria-controls="dashboard-sidebar"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <h1 className="flex flex-1 items-center gap-3 text-xl font-bold tracking-tight text-[#fafafa] md:text-[1.8rem]">
                    <IconLg icon={meta.icon} className="text-[#9146ff]" />
                    {meta.title}
                </h1>

                <div className="flex items-center gap-2">
                    <Dropdown>
                        <DropdownTrigger
                            aria-label="Menú de cuenta"
                            className={`flex items-center gap-2 rounded-xl border border-white/[0.06] bg-bg-secondary py-1 pl-1 pr-2.5 ${hoverSubtleControl}`}
                        >
                            <img
                                src={session.profile_image_url ?? staticPath('/img/logo.svg')}
                                alt=""
                                className="h-8 w-8 shrink-0 rounded-full border border-white/[0.08] object-cover"
                            />
                            <span className="hidden max-w-[120px] truncate text-[0.8125rem] font-semibold text-[#fafafa] md:inline">
                                {displayName}
                            </span>
                            <DropdownChevron className="hidden size-4 shrink-0 text-[#71717a] transition-transform md:block" />
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
