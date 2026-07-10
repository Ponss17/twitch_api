import { useRequiredSession } from '@/core/session/useSession';
import { staticPath } from '@/core/config/paths';
import { AnimatedNumber } from '@/shared/ui/AnimatedNumber';
import { Heart, Video, Calendar, User } from 'lucide-react';


interface SettingsHeroProps {

    followers?: number;
    broadcasterLabel: string;
    memberSince: string;
}

const BROADCASTER_COLORS: Record<string, string> = {
    Partner: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    Afiliado: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
    Streamer: 'border-primary/20 bg-primary/10 text-primary'
};

export function SettingsHero({ followers = 0, broadcasterLabel, memberSince }: SettingsHeroProps) {
    const session = useRequiredSession();
    const badgeColor = BROADCASTER_COLORS[broadcasterLabel] ?? BROADCASTER_COLORS.Streamer;

    return (
        <section className="relative mb-8 overflow-hidden rounded-xl border border-white/[0.08] bg-bg-card p-8 md:p-10 transition-colors duration-300 hover:border-primary/50">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-30 pointer-events-none" />

            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">

                {/* Lado Izquierdo: Avatar e Info */}
                <div className="flex items-center gap-6">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <img
                            src={session.profile_image_url ?? staticPath('/img/logo.svg')}
                            alt=""
                            className="h-20 w-20 rounded-[16px] border-2 border-white/10 object-cover shadow-lg"
                            draggable={false}
                            loading="eager"
                        />
                        <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-[3px] border-bg-card bg-emerald-500" />
                    </div>

                    {/* Texto */}
                    <div className="flex flex-col justify-center">
                        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 mb-2">
                            <h1 className="text-[2.6rem] font-extrabold leading-none tracking-[-0.02em] text-white">
                                Hola, <span className="text-primary">{session.displayName ?? session.login ?? 'Streamer'}</span>
                            </h1>
                            <span className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-2.5 py-1 text-[0.7rem] leading-none font-extrabold uppercase tracking-[0.06em] ${badgeColor}`}>
                                <User className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                <span>{broadcasterLabel}</span>
                            </span>
                        </div>
                        <p className="text-[1.1rem] font-medium leading-relaxed text-zinc-300 underline decoration-primary/40 underline-offset-4 decoration-2">
                            Bienvenido a tu panel de control. Gestiona tus recursos y monitorea tu API.
                        </p>
                    </div>
                </div>

                {/* Lado Derecho: Estadísticas Más Altas */}
                <div className="flex flex-wrap gap-4 shrink-0">
                    {/* Seguidores */}
                    <div className="group relative flex flex-1 xl:flex-initial min-w-[160px] cursor-default items-center gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white/[0.04]">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/40 text-primary transition-transform group-hover:scale-110">
                            <Heart className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Seguidores</span>
                            <AnimatedNumber value={followers} className="text-[1.2rem] font-bold leading-none text-white" />
                        </div>
                    </div>

                    {/* Tipo de Canal */}
                    <div className="group relative flex flex-1 xl:flex-initial min-w-[160px] cursor-default items-center gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-white/[0.04]">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/40 text-emerald-500 transition-transform group-hover:scale-110">
                            <Video className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Tipo Canal</span>
                            <span className="text-[1.2rem] font-bold leading-none text-white">{broadcasterLabel}</span>
                        </div>
                    </div>

                    {/* Miembro Desde */}
                    <div className="group relative flex flex-1 xl:flex-initial min-w-[160px] cursor-default items-center gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/30 hover:bg-white/[0.04]">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 text-amber-500 transition-transform group-hover:scale-110">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Miembro Desde</span>
                            <span className="text-[1.2rem] font-bold leading-none text-white">{memberSince}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
