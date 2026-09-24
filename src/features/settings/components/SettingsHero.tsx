import { useRequiredSession } from '@/core/session/useSession';
import { useTranslation } from '@/core/i18n/I18nContext';
import { AnimatedNumber } from '@/shared/ui/AnimatedNumber';
import { panelCard } from '@/core/utils/tw';
import { subtleIcon } from '@/features/dashboard/lib/ui/subtleAccents';
import { Heart, Video, Calendar } from 'lucide-react';
import { TwitchIcon } from '@/shared/ui/icons/BrandIcons';

interface SettingsHeroProps {
    followers?: number;
    broadcasterLabel: string;
    memberSince: string;
    isLive?: boolean;
    isLoading?: boolean;
}

function ProfileStat({
    icon: Icon,
    label,
    children
}: {
    icon: typeof Heart;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-w-[144px] flex-1 items-center gap-3 xl:min-w-[160px] xl:flex-none">
            <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${subtleIcon('primary')}`}
            >
                <Icon className="h-5 w-5" aria-hidden />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-text-muted">
                    {label}
                </span>
                {children}
            </div>
        </div>
    );
}

export function SettingsHero({
    followers,
    broadcasterLabel,
    memberSince,
    isLive = false,
    isLoading = false
}: SettingsHeroProps) {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const sT = t.settings.hero;
    const name = session.displayName ?? session.login ?? 'Streamer';

    return (
        <section data-tour="home-hero" className={`relative mb-5 flex flex-col justify-center overflow-hidden ${panelCard} p-6`}>
            <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-4">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="flex items-center gap-2.5 text-[1.7rem] font-bold leading-tight tracking-tight text-text-main md:text-[1.85rem]">
                                <TwitchIcon variant="brand" className="block liga:hidden h-7 w-7 shrink-0 md:h-8 md:w-8" />
                                <img src="/img/liga_full.svg" alt="Liga Logo" className="hidden liga:block h-7 w-7 shrink-0 md:h-8 md:w-8" />
                                <span>
                                    {sT.hello} <span className="text-brand-text">{name}</span>
                                </span>
                            </h1>
                            {isLive ? (
                                <div className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-secondary px-2 py-1 text-[0.6875rem] font-semibold tracking-wide text-text-main">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                                    </span>
                                    <span>{sT.liveBadge}</span>
                                </div>
                            ) : null}
                        </div>
                        <p className="mt-1 text-[0.875rem] text-text-muted">{sT.welcome}</p>
                    </div>
                </div>

                <div className="flex w-full flex-wrap rounded-xl border border-border-subtle bg-bg-secondary p-4 [box-shadow:var(--shadow-card,0_8px_30px_rgba(0,0,0,0.5))] xl:w-auto xl:min-w-[29rem] xl:justify-end">
                    <div className="w-full sm:w-auto sm:pr-6">
                        <ProfileStat icon={Heart} label={sT.followers}>
                            {followers === undefined && !isLoading ? (
                                <span
                                    className="text-[1.4rem] font-bold leading-none tracking-tight text-text-main"
                                    title={sT.notAvailable}
                                >
                                    —
                                </span>
                            ) : (
                                <AnimatedNumber
                                    value={followers ?? 0}
                                    isLoading={isLoading}
                                    className="text-[1.4rem] font-bold leading-none tracking-tight text-text-main"
                                />
                            )}
                        </ProfileStat>
                    </div>
                    <div className="w-full border-t border-border-subtle pt-4 sm:w-auto sm:border-l sm:border-t-0 sm:px-6 sm:pt-0">
                        <ProfileStat icon={Video} label={sT.channelType}>
                            <span className="text-[1.4rem] font-bold leading-none tracking-tight text-text-main">
                                {broadcasterLabel}
                            </span>
                        </ProfileStat>
                    </div>
                    <div className="w-full border-t border-border-subtle pt-4 sm:w-auto sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                        <ProfileStat icon={Calendar} label={sT.memberSince}>
                            <span className="text-[1.4rem] font-bold leading-none tracking-tight text-text-main">
                                {memberSince}
                            </span>
                        </ProfileStat>
                    </div>
                </div>
            </div>
        </section>
    );
}
