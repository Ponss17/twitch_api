import type { ReactNode } from 'react';
import { useRequiredSession } from '@/core/session/useSession';
import { staticPath } from '@/core/config/paths';
import { AnimatedNumber } from '@/shared/ui/AnimatedNumber';
import { CheckCircle2, Star, User, Key, Heart, Video, Calendar } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ProfileHeroProps {
    description?: string;
    followers?: number;
    broadcasterLabel: string;
    memberSince: string;
}

function ProfileBadge({
    icon,
    label,
    secondary
}: {
    icon: LucideIcon;
    label: string;
    secondary?: boolean;
}) {
    const Icon = icon;
    return (
        <span
            className={`flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-[0.7rem] font-extrabold uppercase tracking-[0.03em] ${secondary
                    ? 'border border-primary/20 bg-primary/10 text-primary'
                    : 'border border-[#10b981]/20 bg-[#10b981]/10 text-[#10b981]'
                }`}
        >
            <Icon className="w-3.5 h-3.5" aria-hidden />
            {label}
        </span>
    );
}

function ProfileStatItem({
    icon,
    value,
    label,
    showDivider
}: {
    icon: LucideIcon;
    value: ReactNode;
    label: string;
    showDivider?: boolean;
}) {
    const Icon = icon;
    return (
        <div
            className={`relative flex items-center gap-2 transition hover:-translate-y-0.5 ${showDivider
                    ? "after:absolute after:-right-2 after:top-[20%] after:h-[60%] after:w-px after:bg-white/[0.05] after:content-['']"
                    : ''
                }`}
        >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-[0.9rem] text-primary">
                <Icon className="w-4 h-4" aria-hidden />
            </span>
            <div className="flex flex-col">
                <span className="text-[0.9rem] font-extrabold text-white">{value}</span>
                <span className="text-[0.6rem] font-extrabold uppercase tracking-[0.05em] text-[#c4c4cc]">
                    {label}
                </span>
            </div>
        </div>
    );
}

export function ProfileHero({
    description,
    followers = 0,
    broadcasterLabel,
    memberSince
}: ProfileHeroProps) {
    const session = useRequiredSession();
    const badgePartner = broadcasterLabel === 'Partner';
    const badgeAffiliate = broadcasterLabel === 'Afiliado';

    return (
        <div className="profile-hero mb-4">
            <div className="relative flex min-h-[120px] flex-col justify-start overflow-hidden rounded-[20px] border border-primary/25 bg-bg-card transition hover:border-primary/50">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/35 via-transparent to-transparent opacity-60" />
                <div className="relative z-[2] flex flex-row items-center gap-4 px-6 py-4 max-[900px]:flex-col max-[900px]:pb-8 max-[900px]:text-center">
                    <div className="relative shrink-0 max-[900px]:-mt-[60px]">
                        <img
                            src={session.profile_image_url ?? staticPath('/img/logo.svg')}
                            alt=""
                            className="h-20 w-20 rounded-xl border-[3px] border-bg-card bg-bg-tertiary object-cover transition duration-300 hover:scale-105 hover:border-primary"
                            draggable={false}
                            loading="eager"
                            fetchPriority="high"
                        />
                        <span className="absolute bottom-2 -right-1 h-[22px] w-[22px] animate-pulse-glow rounded-full border-[4px] border-bg-card bg-[#10b981]" />
                    </div>

                    <div className="min-w-0 flex-1 text-left max-[900px]:items-center max-[900px]:text-center">
                        <div className="flex flex-wrap items-center gap-4 max-[900px]:justify-center">
                            <h2 className="m-0 font-[Outfit,sans-serif] text-2xl font-black leading-none tracking-[-0.04em] text-white">
                                {session.displayName ?? session.login ?? 'Streamer'}
                            </h2>
                            <div className="flex flex-wrap gap-2.5">
                                {badgePartner && (
                                    <ProfileBadge icon={CheckCircle2} label="Partner de Twitch" />
                                )}
                                {badgeAffiliate && !badgePartner && (
                                    <ProfileBadge icon={Star} label="Afiliado de Twitch" />
                                )}
                                {!badgePartner && !badgeAffiliate && (
                                    <ProfileBadge icon={User} label="Streamer" secondary />
                                )}
                                <ProfileBadge icon={Key} label="LosPerris Access" secondary />
                            </div>
                        </div>

                        <p className="m-0 mt-2 max-w-full text-left text-[0.82rem] font-normal leading-[1.45] text-[#c4c4cc] max-[900px]:text-center">
                            {description || 'Sin biografía disponible. ¡Este streamer es un misterio!'}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-4 pt-1 max-[900px]:justify-center">
                            <ProfileStatItem
                                icon={Heart}
                                value={<AnimatedNumber value={followers} className="text-[0.9rem] font-extrabold text-white" />}
                                label="Seguidores"
                                showDivider
                            />
                            <ProfileStatItem
                                icon={Video}
                                value={broadcasterLabel}
                                label="Tipo Canal"
                                showDivider
                            />
                            <ProfileStatItem icon={Calendar} value={memberSince} label="Miembro" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
