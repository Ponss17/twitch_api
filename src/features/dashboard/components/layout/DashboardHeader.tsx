import { STATUS_PAGE_URL, type DashboardTab } from '@/core/config/config';
import { useRequiredSession } from '@/core/session/useSession';
import { staticPath } from '@/core/config/paths';
import { TAB_META } from '@/features/dashboard/lib/dashboardTabs';
import { IconMd } from '@/shared/ui/Icon';
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
import { User, LogOut, Menu } from 'lucide-react';
import { TwitchIcon, PaypalIcon } from '@/shared/ui/icons/BrandIcons';

const PAYPAL_URL = 'https://www.paypal.me/Ponssjean';

const headerGhostBtn =
    'inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[0.8125rem] font-medium text-[#c4c4cc] no-underline transition hover:border-white/15 hover:bg-white/[0.06] hover:text-[#fafafa]';

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
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-[#c4c4cc] transition hover:bg-white/5 hover:text-white lg:hidden"
                    aria-label="Abrir menú"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <h1 className="flex flex-1 items-center gap-3 text-xl font-bold tracking-tight text-[#fafafa] md:text-[1.8rem]">
                    <IconMd icon={meta.icon} className="text-[#9146ff]" />
                    {meta.title}
                </h1>

                <div className="flex items-center gap-2">
                    <a
                        href={STATUS_PAGE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={headerGhostBtn}
                        title="Status del servicio"
                    >
                        Status
                    </a>

                    <a
                        href={PAYPAL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${headerGhostBtn} hidden sm:inline-flex`}
                        title="Apoyar el proyecto con PayPal"
                    >
                        <PaypalIcon className="h-4 w-4 shrink-0" />
                        <span>Apoyar</span>
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
