import { memo, useMemo } from 'react';
import { STATUS_PAGE_URL, type DashboardTab } from '@/core/config/config';
import { appPath, saveDocsReturnPath, shouldSavePanelReturn } from '@/core/config/paths';
import { panelCard, fadeIn, hoverSubtleBorderedRow } from '@/core/utils/tw';
import { subtleIcon } from '@/features/dashboard/lib/ui/subtleAccents';
import {
    type DashboardLiveStats,
    type DashboardUsageKey,
    DASHBOARD_USAGE_CATEGORIES
} from '@/features/dashboard/lib/data/dashboardStats';
import {
    UserRoundCheck,
    Timer,
    Clapperboard,
    Megaphone,
    Binoculars,
    TrendingUp,
    Dices,
    Crosshair,
    CircleDot,
    Swords,
    Cherry,
    Info,
    Book,
    Server,
    LayoutGrid
} from 'lucide-react';
import { useTranslation } from '@/core/i18n/I18nContext';
import type { Translations } from '@/core/i18n/locales/es';
import type { LucideIcon } from 'lucide-react';

interface HomeResourcesPanelProps {
    onNavigate?: (tab: DashboardTab) => void;
    stats?: Partial<Pick<DashboardLiveStats, DashboardUsageKey>>;
}

const ICON_WRAP = `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${subtleIcon('primary')}`;

type UsageTab = Extract<
    DashboardTab,
    | 'followage'
    | 'watchtime'
    | 'clips'
    | 'shoutout'
    | 'stalker'
    | 'trends'
    | 'roulette'
    | 'russian'
    | 'magic8'
    | 'duel'
    | 'slots'
>;

const USAGE_TO_TAB: Record<DashboardUsageKey, UsageTab> = {
    followage: 'followage',
    watchtime: 'watchtime',
    clips: 'clips',
    so: 'shoutout',
    stalker: 'stalker',
    trends: 'trends',
    roulette: 'roulette',
    russian: 'russian',
    magic8: 'magic8',
    duel: 'duel',
    slots: 'slots'
};

const TAB_ICONS: Record<UsageTab, LucideIcon> = {
    followage: UserRoundCheck,
    watchtime: Timer,
    clips: Clapperboard,
    shoutout: Megaphone,
    stalker: Binoculars,
    trends: TrendingUp,
    roulette: Dices,
    russian: Crosshair,
    magic8: CircleDot,
    duel: Swords,
    slots: Cherry
};

const DEFAULT_TOP: UsageTab[] = ['followage', 'watchtime', 'clips'];
const TOP_N = 3;

const ALL_USAGE_KEYS: readonly DashboardUsageKey[] = DASHBOARD_USAGE_CATEGORIES.flatMap(
    (cat) => cat.keys
);

function topUsedTabs(stats?: Partial<Pick<DashboardLiveStats, DashboardUsageKey>>): UsageTab[] {
    const ranked = ALL_USAGE_KEYS.map((key) => ({
        tab: USAGE_TO_TAB[key],
        count: stats?.[key] ?? 0
    }))
        .filter((row) => row.count > 0)
        .sort((a, b) => b.count - a.count || a.tab.localeCompare(b.tab));

    if (ranked.length === 0) return DEFAULT_TOP;

    const tabs = ranked.slice(0, TOP_N).map((row) => row.tab);
    for (const fallback of DEFAULT_TOP) {
        if (tabs.length >= TOP_N) break;
        if (!tabs.includes(fallback)) tabs.push(fallback);
    }
    return tabs;
}

const USEFUL_LINKS: Array<{
    href: string;
    icon: LucideIcon | React.ElementType;
    labelKey: keyof Translations['home']['resources'];
    external?: boolean;
}> = [
    { href: '/about', icon: Info, labelKey: 'about' },
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

export const HomeResourcesPanel = memo(function HomeResourcesPanel({
    onNavigate,
    stats
}: HomeResourcesPanelProps) {
    const { t } = useTranslation();
    const rT = t.home.resources;
    const navLabels = t.sidebar.items;
    const topTabs = useMemo(() => topUsedTabs(stats), [stats]);

    return (
        <div
            data-tour="home-resources"
            className={`${panelCard} ${fadeIn} flex h-auto flex-col min-[1001px]:h-full`}
            style={{ animationDelay: '60ms' }}
        >
            <div className="flex shrink-0 items-center gap-3 border-b border-border-subtle px-5 py-3.5">
                <div className={ICON_WRAP}>
                    <LayoutGrid className="h-4 w-4" aria-hidden />
                </div>
                <h2 className="text-[0.9375rem] font-semibold tracking-tight text-text-main">{rT.title}</h2>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-5 p-4">
                <section className="flex flex-col">
                    <p className={SECTION_LABEL}>{rT.commands}</p>
                    <div className="flex flex-col gap-1.5">
                        {topTabs.map((tab) => {
                            const Icon = TAB_ICONS[tab];
                            return (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => onNavigate?.(tab)}
                                    className={ROW}
                                >
                                    <span className={ICON_WRAP}>
                                        <Icon className="h-4 w-4" aria-hidden />
                                    </span>
                                    {navLabels[tab]}
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="flex flex-col">
                    <p className={SECTION_LABEL}>{rT.links}</p>
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
