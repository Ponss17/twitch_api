import { useRequiredSession } from '@/core/session/useSession';
import { staticPath } from '@/core/config/paths';
import { panelCard } from '@/core/utils/tw';
import { AnimatedNumber } from '@/shared/ui/AnimatedNumber';
import { Heart, Video, Calendar } from 'lucide-react';

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
    isLive,
    isLoading = false
}: SettingsHeroProps) {
    const session = useRequiredSession();
    const name = session.displayName ?? session.login ?? 'Streamer';

    return (
        <section className={`${panelCard} relative mb-5 overflow-hidden px-6 py-5`}>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/[0.07] via-transparent to-transparent" />

            <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                        <img
                            src={session.profile_image_url ?? staticPath('/img/logo.svg')}
                            alt=""
                            className="h-[3.75rem] w-[3.75rem] rounded-xl border border-primary/40 object-cover"
                            draggable={false}
                            loading="eager"
                        />
                        {isLive !== undefined && (
                            <span
                                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-bg-card ${isLive ? 'bg-emerald-500' : 'bg-zinc-500'}`}
                                title={isLive ? 'En vivo' : 'Desconectado'}
                            />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-[1.7rem] font-bold leading-tight tracking-tight text-white md:text-[1.85rem]">
                                Hola, <span className="text-primary">{name}</span>
                            </h1>
                            <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-primary">
                                {broadcasterLabel}
                            </span>
                        </div>
                        <p className="mt-1 text-[0.875rem] text-[#8b8b93]">
                            Bienvenido a tu panel · actividad y accesos rápidos
                        </p>
                    </div>
                </div>

                <div className="flex w-full flex-wrap gap-y-4 border-t border-white/[0.06] pt-4 xl:w-auto xl:min-w-[29rem] xl:justify-end xl:border-0 xl:pt-0">
                    <div className="pr-6">
                        <ProfileStat
                            icon={Heart}
                            iconClass="border-primary/25 bg-transparent text-primary"
                            label="Seguidores"
                        >
                            {followers === undefined && !isLoading ? (
                                <span
                                    className="text-[1.4rem] font-bold leading-none tracking-tight text-white"
                                    title="No disponible ahora mismo"
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
                    <div className="border-l border-white/[0.08] px-6">
                        <ProfileStat
                            icon={Video}
                            iconClass="border-primary/25 bg-transparent text-primary"
                            label="Tipo canal"
                        >
                            <span className="text-[1.4rem] font-bold leading-none tracking-tight text-white">
                                {broadcasterLabel}
                            </span>
                        </ProfileStat>
                    </div>
                    <div className="border-l border-white/[0.08] pl-6">
                        <ProfileStat
                            icon={Calendar}
                            iconClass="border-primary/25 bg-transparent text-primary"
                            label="Miembro desde"
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
