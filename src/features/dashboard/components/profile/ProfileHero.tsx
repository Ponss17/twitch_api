import { useRequiredSession } from '@/core/session/useSession';
import { staticPath } from '@/core/config/paths';
import { AnimatedNumber } from '@/shared/ui/AnimatedNumber';
import { Heart, Video, Calendar, User } from 'lucide-react';
import { card, fadeIn } from '@/core/ui/tw';

interface ProfileHeroProps {
    description?: string;
    followers?: number;
    broadcasterLabel: string;
    memberSince: string;
}

const BROADCASTER_COLORS: Record<string, string> = {
    Partner: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    Afiliado: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
    Streamer: 'border-primary/20 bg-primary/10 text-primary'
};

export function ProfileHero({ description, followers = 0, broadcasterLabel, memberSince }: ProfileHeroProps) {
    const session = useRequiredSession();
    const badgeColor = BROADCASTER_COLORS[broadcasterLabel] ?? BROADCASTER_COLORS.Streamer;

    return (
        <div className={`${card} ${fadeIn} mb-3 opacity-0 [animation-delay:0ms]`}>
            {/* Avatar + nombre + badge */}
            <div className="flex items-center gap-4 border-b border-white/[0.08] pb-3 mb-3">
                <div className="relative shrink-0">
                    <img
                        src={session.profile_image_url ?? staticPath('/img/logo.svg')}
                        alt=""
                        className="h-14 w-14 rounded-xl border-2 border-white/10 object-cover"
                        draggable={false}
                        loading="eager"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-bg-card bg-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <h2 className="text-lg font-bold text-white leading-none">
                            {session.displayName ?? session.login ?? 'Streamer'}
                        </h2>
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-[0.06em] ${badgeColor}`}>
                            <User className="w-3 h-3" aria-hidden />
                            {broadcasterLabel}
                        </span>
                    </div>
                    <p className="text-[0.82rem] text-zinc-400 leading-snug line-clamp-2">
                        {description || 'Sin biografía disponible.'}
                    </p>
                </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Heart className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                        <AnimatedNumber value={followers} className="text-[0.9rem] font-bold text-white leading-none" />
                        <span className="text-[0.6rem] font-bold uppercase tracking-wide text-zinc-400">Seguidores</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Video className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[0.9rem] font-bold text-white leading-none">{broadcasterLabel}</span>
                        <span className="text-[0.6rem] font-bold uppercase tracking-wide text-zinc-400">Tipo Canal</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[0.9rem] font-bold text-white leading-none">{memberSince}</span>
                        <span className="text-[0.6rem] font-bold uppercase tracking-wide text-zinc-400">Miembro desde</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
