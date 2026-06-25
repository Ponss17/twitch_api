import type { DashboardTab } from '@/lib/config';
import { appPath, saveDocsReturnPath, shouldSavePanelReturn } from '@/lib/paths';
import { card, fadeIn } from '@/lib/tw';
import { DiscordIcon } from '@/components/ui/icons/BrandIcons';
import { IconMd } from '@/components/ui/Icon';
import { UserRoundCheck, Clapperboard, Megaphone, Info, Book } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface HomeResourcesPanelProps {
    onNavigate?: (tab: DashboardTab) => void;
}

const QUICK_COMMANDS: { tab: DashboardTab; icon: LucideIcon; label: string }[] = [
    { tab: 'followage' as DashboardTab, icon: UserRoundCheck, label: 'Followage' },
    { tab: 'clips' as DashboardTab, icon: Clapperboard, label: 'Clips' },
    { tab: 'shoutout' as DashboardTab, icon: Megaphone, label: 'Shoutout' }
];

const USEFUL_LINKS: Array<{
    href: string;
    icon: LucideIcon | React.ElementType;
    label: string;
    external?: boolean;
}> = [
    { href: '/sobre-la-api', icon: Info, label: 'Sobre la API' },
    { href: '/docs', icon: Book, label: 'Documentación' },
    {
        href: 'https://discord.gg/8uN3qY5E',
        icon: DiscordIcon,
        label: 'Discord Soporte',
        external: true
    }
];

export function HomeResourcesPanel({ onNavigate }: HomeResourcesPanelProps) {
    return (
        <div className={`${card} ${fadeIn} mb-0 flex h-[420px] flex-col`} style={{ animationDelay: '60ms' }}>
            <div className="mb-2 flex items-center gap-3 border-b border-white/[0.08] pb-2">
                <h3 className="text-[0.95rem] font-bold">Recursos</h3>
            </div>

            <div className="flex flex-1 flex-col text-[#fafafa]">
                <p className="mb-2 text-[0.65rem] font-extrabold uppercase tracking-[0.1em] text-primary opacity-80">
                    Comandos Frecuentes
                </p>
                <div className="mb-3 flex flex-col gap-1.5">
                    {QUICK_COMMANDS.map((link) => (
                        <button
                            key={link.tab}
                            type="button"
                            onClick={() => onNavigate?.(link.tab)}
                            className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-primary/[0.03] px-2.5 py-1.5 text-left text-[0.75rem] font-semibold text-[#a1a1aa] transition-all duration-200 hover:translate-x-1 hover:border-primary hover:bg-bg-tertiary hover:text-[#fafafa]"
                        >
                            <IconMd icon={link.icon} />
                            {link.label}
                        </button>
                    ))}
                </div>

                <p className="mb-2 text-[0.65rem] font-extrabold uppercase tracking-[0.1em] text-primary opacity-80">
                    Enlaces Útiles
                </p>
                <div className="flex flex-col gap-1.5">
                    {USEFUL_LINKS.map((link) => {
                        const LinkIcon = link.icon;
                        return (
                        <a
                            key={link.href}
                            href={link.external ? link.href : appPath(link.href)}
                            target={link.external ? '_blank' : undefined}
                            rel={link.external ? 'noopener noreferrer' : undefined}
                            onClick={shouldSavePanelReturn(link.href) ? saveDocsReturnPath : undefined}
                            className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[0.8rem] font-semibold text-[#a1a1aa] no-underline transition-all duration-200 hover:translate-x-1 hover:border-primary hover:bg-bg-tertiary hover:text-[#fafafa]"
                        >
                            <LinkIcon className="size-5 shrink-0" aria-hidden />
                            {link.label}
                        </a>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
