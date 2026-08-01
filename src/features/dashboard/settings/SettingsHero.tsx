import { useRequiredSession } from '@/core/session/useSession';
import { useTranslation } from '@/core/i18n/I18nContext';
import { AnimatedNumber } from '@/shared/ui/AnimatedNumber';
import { panelCard } from '@/core/utils/tw';
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
    iconClass,
    label,
    children
}: {
    icon: typeof Heart;
    iconClass: string;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-w-[144px] flex-1 items-center gap-3 xl:min-w-[160px] xl:flex-none">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${iconClass}`}>
                <Icon className="h-5 w-5" aria-hidden />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-[#8b8b93]">
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

    isLoading = false
}: SettingsHeroProps) {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const sT = t.settings.hero;
    const name = session.displayName ?? session.login ?? 'Streamer';

    return (
        <section className={`relative mb-5 flex flex-col justify-center overflow-hidden ${panelCard} p-6`}>


            <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-4">

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="flex items-center gap-2.5 text-[1.7rem] font-bold leading-tight tracking-tight text-white md:text-[1.85rem]">
                                <TwitchIcon variant="brand" className="h-7 w-7 shrink-0 md:h-8 md:w-8" />
                                <span>{sT.hello} <span className="text-[#9146ff]">{name}</span></span>
                            </h1>
                        </div>
                        <p className="mt-1 text-[0.875rem] text-[#8b8b93]">
                            {sT.welcome}
                        </p>
                    </div>
                </div>

                <div className="flex w-full flex-wrap gap-y-4 rounded-xl bg-black/20 shadow-[0_8px_30px_rgba(0,0,0,0.5)] p-4 border border-white/[0.03] xl:w-auto xl:min-w-[29rem] xl:justify-end">
                    <div className="pr-6">
                        <ProfileStat
                            icon={Heart}
                            iconClass="text-[#9146ff]"
                            label={sT.followers}
                        >
                            {followers === undefined && !isLoading ? (
                                <span
                                    className="text-[1.4rem] font-bold leading-none tracking-tight text-white"
                                    title={sT.notAvailable}
                                >
                                    —
                                </span>
                            ) : (
                                <AnimatedNumber
                                    value={followers ?? 0}
                                    isLoading={isLoading}
                                    className="text-[1.4rem] font-bold leading-none tracking-tight text-white"
                                />
                            )}
                        </ProfileStat>
                    </div>
                    <div className="border-l border-white/[0.06] px-6">
                        <ProfileStat
                            icon={Video}
                            iconClass="text-[#9146ff]"
                            label={sT.channelType}
                        >
                            <span className="text-[1.4rem] font-bold leading-none tracking-tight text-white">
                                {broadcasterLabel}
                            </span>
                        </ProfileStat>
                    </div>
                    <div className="border-l border-white/[0.06] pl-6">
                        <ProfileStat
                            icon={Calendar}
                            iconClass="text-[#9146ff]"
                            label={sT.memberSince}
                        >
                            <span className="text-[1.4rem] font-bold leading-none tracking-tight text-white">
                                {memberSince}
                            </span>
                        </ProfileStat>
                    </div>
                </div>
            </div>
        </section>
    );
}
