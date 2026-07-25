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

function getTabSubtitle(tab: string, _name: string): string {
    switch (tab) {
        case 'home': {
            return `Resumen general y métricas en tiempo real de tu canal.`;
        }
        case 'analytics': return 'Mide el impacto y rendimiento de tus comandos en vivo.';
        case 'followage': return 'Configura el comando para ver cuánto llevan siguiéndote.';
        case 'clips': return 'Permite a tus viewers crear clips rápidos en tu canal.';
        case 'shoutout': return 'Promociona y dale amor a otros streamers fácilmente.';
        case 'trends': return 'Descubre las palabras y temas más mencionados en tu chat.';
        case 'stalker': return 'Busca información pública detallada de cuentas de Twitch.';
        case 'roulette': return 'Organiza sorteos y decisiones al azar con tu audiencia.';
        case 'magic8': return 'Deja que el azar responda las dudas existenciales de tu chat.';
        case 'russian': return 'Un minijuego letal de azar. ¿Quién sobrevivirá?';
        case 'duel': return 'Combates entre viewers. Configura las probabilidades.';
        case 'feedback': return 'Ayúdanos a mejorar contándonos qué te gustaría ver.';
        case 'settings': return 'Ajustes generales de tu cuenta y preferencias.';
        default: return 'Gestiona las herramientas de tu stream.';
    }
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
            <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-8 lg:px-12 xl:px-16">
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

                <div className="flex flex-1 flex-col justify-center">
                    <div className="flex items-center gap-2.5">
                        <meta.icon className="h-[1.3rem] w-[1.3rem] text-[#9146ff]" />
                        <h1 className="text-[1.35rem] font-semibold tracking-tight text-white md:text-[1.5rem]">
                            {meta.title}
                        </h1>
                    </div>
                    <p className="mt-1 hidden text-[0.85rem] text-zinc-400 md:block">
                        {getTabSubtitle(tab, displayName)}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Dropdown>
                        <DropdownTrigger
                            aria-label="Menú de cuenta"
                            className="group flex items-center gap-3 rounded-[1.1rem] border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-4 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/10 aria-expanded:border-[#9146ff]/50 aria-expanded:bg-white/10 aria-expanded:shadow-[#9146ff]/10"
                        >
                            <img
                                src={session.profile_image_url?.replace('300x300', '70x70') ?? staticPath('/img/logo.svg')}
                                alt=""
                                className="h-9 w-9 shrink-0 rounded-full border-[2px] border-white/5 object-cover transition-all duration-300 group-hover:border-white/20 group-aria-expanded:border-[#9146ff] group-aria-expanded:ring-4 group-aria-expanded:ring-[#9146ff]/30"
                            />
                            <span className="hidden max-w-[120px] truncate text-[0.9rem] font-medium text-zinc-300 transition-colors duration-300 group-hover:text-white group-aria-expanded:text-white md:inline">
                                {displayName}
                            </span>
                            <DropdownChevron className="hidden size-4 shrink-0 text-zinc-500 transition-colors duration-300 group-hover:text-zinc-300 group-aria-expanded:text-[#9146ff] md:block" />
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
