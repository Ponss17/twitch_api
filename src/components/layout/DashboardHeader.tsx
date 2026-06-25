import type { DashboardTab } from '@/lib/config';
import { useRequiredSession } from '@/hooks/useSession';
import { staticPath } from '@/lib/paths';
import { TAB_META } from '@/lib/dashboardTabs';
import { IconMd } from '@/components/ui/Icon';
import {
    Dropdown,
    DropdownChevron,
    DropdownDivider,
    DropdownHeader,
    DropdownItem,
    DropdownLink,
    DropdownPanel,
    DropdownTrigger
} from '@/components/ui/Dropdown';
import { User, LogOut, Menu } from 'lucide-react';
import { TwitchIcon, PaypalIcon } from '@/components/ui/icons/BrandIcons';

interface DashboardHeaderProps {
    tab: DashboardTab;
    onProfile: () => void;
    onLogout: () => void;
    onMenuToggle: () => void;
}

export function DashboardHeader({ tab, onProfile, onLogout, onMenuToggle }: DashboardHeaderProps) {
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
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-[#a1a1aa] transition hover:bg-white/5 hover:text-white lg:hidden"
                    aria-label="Abrir menú"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <h1 className="flex flex-1 items-center gap-3 text-xl font-bold tracking-tight text-[#fafafa] md:text-[1.8rem]">
                    <IconMd icon={meta.icon} className="text-[#9146ff]" />
                    {meta.title}
                </h1>

                <div className="flex items-center gap-4">
                    <a
                        href="https://www.paypal.me/Ponssjean"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden items-center gap-2 rounded-full border border-white/[0.05] bg-white/[0.03] px-3 py-1.5 text-[0.85rem] font-semibold text-[#a1a1aa] no-underline transition hover:-translate-y-px hover:border-[#0070ba]/20 hover:bg-[#0070ba]/[0.08] hover:text-[#fafafa] sm:flex"
                        title="Apoyar el proyecto"
                    >
                        <PaypalIcon className="size-4 shrink-0 text-[#0070ba]" />
                        <span>Donación</span>
                    </a>

                    <Dropdown>
                        <DropdownTrigger
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
                            <DropdownChevron className="w-4 h-4 text-[#71717a] transition-transform" />
                        </DropdownTrigger>

                        <DropdownPanel widthClassName="w-[230px]" zIndex={1000} className="rounded-2xl">
                            <DropdownHeader>Mi Cuenta</DropdownHeader>
                            <DropdownItem onClick={onProfile}>
                                <User className="w-4 text-center" />
                                Mi Perfil
                            </DropdownItem>
                            <DropdownLink href={twitchProfileUrl} target="_blank" rel="noopener noreferrer">
                                <TwitchIcon className="w-4 text-center" />
                                Perfil de Twitch
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
