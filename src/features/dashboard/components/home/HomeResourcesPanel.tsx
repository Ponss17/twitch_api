import { memo } from 'react';
import { STATUS_PAGE_URL, type DashboardTab } from '@/core/config/config';
import { appPath, saveDocsReturnPath, shouldSavePanelReturn } from '@/core/config/paths';
import { card, fadeIn } from '@/core/ui/tw';
import { IconMd } from '@/shared/ui/Icon';
import { UserRoundCheck, Clapperboard, Megaphone, Info, Book, LayoutGrid, Server } from 'lucide-react';
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
        href: STATUS_PAGE_URL,
        icon: Server,
        label: 'Status del Sistema',
        external: true
    }
];

const LINK_BTN =
    'flex min-h-0 flex-1 items-center gap-2.5 rounded-md border border-white/[0.08] bg-white/[0.02] px-2.5 text-left text-[0.75rem] font-semibold text-[#c4c4cc] transition-all duration-200 hover:border-primary hover:bg-bg-tertiary hover:text-[#fafafa]';

const SECTION_LABEL =
    'mb-1.5 shrink-0 text-[0.65rem] font-extrabold uppercase tracking-[0.1em] text-primary opacity-80';

export const HomeResourcesPanel = memo(function HomeResourcesPanel({ onNavigate }: HomeResourcesPanelProps) {
    return (
        <div className={`${card} ${fadeIn} mb-0 flex h-[460px] flex-col`} style={{ animationDelay: '60ms' }}>
            <div className="mb-2 flex shrink-0 items-center gap-3 border-b border-white/[0.08] pb-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                    <LayoutGrid className="h-4 w-4" aria-hidden />
                </div>
                <h3 className="text-[0.95rem] font-bold">Recursos</h3>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3 text-[#fafafa]">
                <section className="flex min-h-0 flex-1 flex-col">
                    <p className={SECTION_LABEL}>Comandos Frecuentes</p>
                    <div className="flex min-h-0 flex-1 flex-col gap-1.5">
                        {QUICK_COMMANDS.map((link) => (
                            <button
                                key={link.tab}
                                type="button"
                                onClick={() => onNavigate?.(link.tab)}
                                className={LINK_BTN}
                            >
                                <IconMd icon={link.icon} />
                                {link.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="flex min-h-0 flex-1 flex-col">
                    <p className={SECTION_LABEL}>Enlaces Útiles</p>
                    <div className="flex min-h-0 flex-1 flex-col gap-1.5">
                        {USEFUL_LINKS.map((link) => {
                            const LinkIcon = link.icon;
                            return (
                                <a
                                    key={link.href}
                                    href={link.external ? link.href : appPath(link.href)}
                                    target={link.external ? '_blank' : undefined}
                                    rel={link.external ? 'noopener noreferrer' : undefined}
                                    onClick={shouldSavePanelReturn(link.href) ? saveDocsReturnPath : undefined}
                                    className={LINK_BTN}
                                >
                                    <LinkIcon className="size-5 shrink-0" aria-hidden />
                                    {link.label}
                                </a>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
});
