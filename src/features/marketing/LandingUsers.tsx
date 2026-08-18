import { useEffect, useState } from 'react';
import { appPath } from '@/core/config/paths';
import { card } from '@/core/utils/tw';
import { LandingReveal } from './LandingReveal';
import { LandingFloatIcons } from './LandingMotif';

export interface PublicUser {
    login: string;
    displayName: string;
    profileImageUrl: string;
    broadcasterType: string;
    description: string;
}

function broadcasterLabel(type: string): string {
    if (type === 'affiliate') return 'Afiliado';
    if (type === 'partner') return 'Partner';
    return 'Streamer';
}

export function LandingUsers() {
    const [users, setUsers] = useState<PublicUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        fetch(appPath('/api/system/public-users/'))
            .then((res) => res.json())
            .then((data) => {
                if (isMounted && data.ok && Array.isArray(data.users)) {
                    setUsers(data.users);
                }
            })
            .catch(() => {})
            .finally(() => {
                if (isMounted) setLoading(false);
            });
        return () => {
            isMounted = false;
        };
    }, []);

    if (loading) {
        return (
            <section className="relative scroll-mt-24 px-5 pt-16 pb-20 md:px-8 md:pt-24 md:pb-28 text-center text-text-muted">
                Cargando pioneros...
            </section>
        );
    }

    if (users.length === 0) {
        return null;
    }

    const midpoint = Math.ceil(users.length / 2);
    const row1 = users.slice(0, midpoint);
    const row2 = users.slice(midpoint);

    const renderMarqueeRow = (items: PublicUser[], reverse?: boolean) => {
        if (items.length === 0) return null;
        const copies = [...items, ...items, ...items, ...items];

        return (
            <div className="group flex overflow-hidden">
                <div
                    className={`flex shrink-0 gap-4 py-2 ${reverse ? 'landing-marquee-reverse' : 'landing-marquee'}`}
                >
                    {copies.map((user, idx) => (
                        <div
                            key={`${user.login}-${idx}`}
                            className={`${card} flex w-[220px] md:w-[240px] flex-col p-4 transition-colors hover:border-brand-purple/40 shrink-0`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <a
                                    href={`https://twitch.tv/${encodeURIComponent(user.login)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 group/link"
                                >
                                    <img
                                        src={user.profileImageUrl}
                                        alt=""
                                        className="w-11 h-11 rounded-full border border-border-subtle bg-bg-main object-cover transition-colors group-hover/link:border-brand-purple/50"
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-text-main leading-tight transition-colors group-hover/link:text-brand-purple line-clamp-1">
                                            {user.displayName}
                                        </span>
                                        <span className="mt-0.5 text-[0.7rem] font-mono font-medium text-brand-purple capitalize tracking-wide">
                                            {broadcasterLabel(user.broadcasterType)}
                                        </span>
                                    </div>
                                </a>
                                <a
                                    href={`https://twitch.tv/${encodeURIComponent(user.login)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Canal de Twitch de ${user.displayName}`}
                                    className="text-text-muted opacity-50 hover:opacity-100 transition-opacity hover:text-brand-purple mt-1 shrink-0"
                                >
                                    <svg fill="currentColor" className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                                        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                                    </svg>
                                </a>
                            </div>
                            <p className="mt-4 text-sm leading-relaxed text-text-muted line-clamp-3 overflow-hidden">
                                {user.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <section id="pioneros" className="relative scroll-mt-24 px-5 pt-16 pb-20 md:px-8 md:pt-24 md:pb-28 overflow-hidden">
            <LandingFloatIcons layout="c" side="right" />

            <LandingReveal className="relative z-[1] mx-auto mb-10 max-w-[1080px] text-center md:mb-14">
                <h2 className="text-3xl font-semibold tracking-tight text-text-main md:text-[2.25rem] md:leading-tight">
                    Streamers que utilizan la API
                </h2>
                <p className="mt-3 text-base leading-relaxed text-text-muted md:text-lg">
                    Únete a los streamers que ya confían en la API para sus directos.
                </p>
            </LandingReveal>

            <LandingReveal className="relative z-[1] flex flex-col gap-4 mx-auto max-w-[1080px] w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 md:w-40 bg-gradient-to-r from-bg-main to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 md:w-40 bg-gradient-to-l from-bg-main to-transparent" />

                <div className="flex flex-col gap-4 w-full">
                    {renderMarqueeRow(row1)}
                    {renderMarqueeRow(row2, true)}
                </div>
            </LandingReveal>
        </section>
    );
}
