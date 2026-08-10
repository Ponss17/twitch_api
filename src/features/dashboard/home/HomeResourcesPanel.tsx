import { memo } from 'react';
import { STATUS_PAGE_URL, type DashboardTab } from '@/core/config/config';
import { appPath, saveDocsReturnPath, shouldSavePanelReturn } from '@/core/config/paths';
import { panelCard, fadeIn, hoverSubtleBorderedRow } from '@/core/utils/tw';
import { subtleIcon } from '@/features/dashboard/lib/subtleAccents';
import { UserRoundCheck, Clapperboard, Megaphone, Info, Book, Server, LayoutGrid } from 'lucide-react';
import { useTranslation } from '@/core/i18n/I18nContext';
import type { Translations } from '@/core/i18n/locales/es';
import type { LucideIcon } from 'lucide-react';

interface HomeResourcesPanelProps {
    onNavigate?: (tab: DashboardTab) => void;
}

const ICON_WRAP = `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${subtleIcon('primary')}`;

const QUICK_COMMANDS: { tab: DashboardTab; icon: LucideIcon; label: string }[] = [
    { tab: 'followage' as DashboardTab, icon: UserRoundCheck, label: 'Followage' },
    { tab: 'clips' as DashboardTab, icon: Clapperboard, label: 'Clips' },
    { tab: 'shoutout' as DashboardTab, icon: Megaphone, label: 'Shoutout' }
];

const USEFUL_LINKS: Array<{
    href: string;
    icon: LucideIcon | React.ElementType;
    labelKey: keyof Translations['home']['resources'];
    external?: boolean;
}> = [
    { href: '/sobre-la-api', icon: Info, labelKey: 'about' },
    { href: '/docs', icon: Book, labelKey: 'docs' },
    {
        href: STATUS_PAGE_URL,
        icon: Server,
        labelKey: 'status',
        external: true
    }
];

const ROW =
    `flex min-h-[44px] w-full items-center gap-2.5 rounded-lg border border-border-subtle bg-bg-secondary py-0 pl-1.5 pr-3 text-left text-[0.8125rem] font-semibold text-text-muted ${hoverSubtleBorderedRow}`;

const SECTION_LABEL =
    'mb-2 shrink-0 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-text-muted';

export const HomeResourcesPanel = memo(function HomeResourcesPanel({ onNavigate }: HomeResourcesPanelProps) {
    const { t } = useTranslation();
    const rT = t.home.resources;

    return (
        <div
            className={`${panelCard} ${fadeIn} flex h-[510px] flex-col`}
            style={{ animationDelay: '60ms' }}
        >
            <div className="flex shrink-0 items-center gap-3 border-b border-border-subtle px-5 py-3.5">
                <div className={ICON_WRAP}>
                    <LayoutGrid className="h-4 w-4" aria-hidden />
                </div>
                <h2 className="text-[0.9375rem] font-semibold tracking-tight text-text-main">{rT.title}</h2>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-5 p-4">
                <section className="flex min-h-0 flex-1 flex-col">
                    <p className={SECTION_LABEL}>{rT.commands}</p>
                    <div className="flex min-h-0 flex-1 flex-col gap-1.5">
                        {QUICK_COMMANDS.map((link) => {
                            const Icon = link.icon;
                            return (
                                <button
                                    key={link.tab}
                                    type="button"
                                    onClick={() => onNavigate?.(link.tab)}
                                    className={ROW}
                                >
                                    <span className={ICON_WRAP}>
                                        <Icon className="h-4 w-4" aria-hidden />
                                    </span>
                                    {link.label}
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="flex min-h-0 flex-1 flex-col">
                    <p className={SECTION_LABEL}>{rT.links}</p>
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
                                    className={ROW}
                                >
                                    <span className={ICON_WRAP}>
                                        <LinkIcon className="h-4 w-4" aria-hidden />
                                    </span>
                                    {rT[link.labelKey]}
                                </a>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
});
