import { type ComponentType, type CSSProperties, type SVGProps, useEffect, useRef, useState } from 'react';
import { TwitchIcon } from '@/shared/ui/icons/BrandIcons';
import {
    DicesIcon,
    SettingsIcon,
    SwordIcon,
    TrendingUpIcon,
    UserRoundCheckIcon,
    UsersIcon,
    VideoIcon
} from './landingIcons';
import './LandingMotif.css';

type TileIcon = ComponentType<SVGProps<SVGSVGElement>>;

type Tile = {
    Icon: TileIcon;
    top: string;
    x: string;
    size: number;
    rot: number;
    opacity: number;
};

const LAYOUTS: Record<'a' | 'b' | 'c' | 'd', Tile[]> = {
    a: [
        { Icon: TwitchIcon, top: '16%', x: '10%', size: 88, rot: -8, opacity: 0.28 },
        { Icon: SwordIcon, top: '40%', x: '38%', size: 76, rot: 10, opacity: 0.22 },
        { Icon: DicesIcon, top: '64%', x: '6%', size: 84, rot: -4, opacity: 0.32 }
    ],
    b: [
        { Icon: VideoIcon, top: '12%', x: '18%', size: 82, rot: 7, opacity: 0.26 },
        { Icon: SettingsIcon, top: '38%', x: '4%', size: 70, rot: -11, opacity: 0.2 },
        { Icon: UsersIcon, top: '62%', x: '32%', size: 90, rot: 5, opacity: 0.3 }
    ],
    c: [
        { Icon: TrendingUpIcon, top: '20%', x: '8%', size: 86, rot: -6, opacity: 0.24 },
        { Icon: UserRoundCheckIcon, top: '46%', x: '36%', size: 74, rot: 9, opacity: 0.3 },
        { Icon: TwitchIcon, top: '68%', x: '10%', size: 80, rot: -3, opacity: 0.22 }
    ],
    d: [
        { Icon: DicesIcon, top: '26%', x: '20%', size: 84, rot: 12, opacity: 0.28 },
        { Icon: VideoIcon, top: '52%', x: '4%', size: 72, rot: -7, opacity: 0.2 },
        { Icon: SwordIcon, top: '70%', x: '34%', size: 88, rot: 4, opacity: 0.26 }
    ]
};

export function LandingFloatIcons({
    layout,
    side
}: {
    layout: keyof typeof LAYOUTS;
    side: 'left' | 'right';
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const mq = window.matchMedia('(min-width: 1280px)');
        let io: IntersectionObserver | null = null;

        const stop = () => {
            io?.disconnect();
            io = null;
            setActive(false);
        };

        const start = () => {
            if (io) return;
            io = new IntersectionObserver(
                ([entry]) => setActive(!!entry?.isIntersecting),
                { rootMargin: '80px 0px', threshold: 0 }
            );
            io.observe(el);
        };

        const sync = () => {
            if (mq.matches) start();
            else stop();
        };

        sync();
        mq.addEventListener('change', sync);
        return () => {
            mq.removeEventListener('change', sync);
            stop();
        };
    }, []);

    return (
        <div
            ref={ref}
            aria-hidden
            className={`landing-float pointer-events-none absolute inset-y-0 z-0 hidden w-[min(20vw,300px)] text-text-muted xl:block ${
                side === 'left' ? 'left-0' : 'right-0'
            }`}
        >
            {LAYOUTS[layout].map((tile, i) => {
                const Icon = tile.Icon;
                const wrapStyle = {
                    top: tile.top,
                    [side === 'left' ? 'left' : 'right']: tile.x,
                    width: tile.size,
                    height: tile.size,
                    '--lev-dur': `${5.2 + i * 0.9}s`,
                    '--lev-delay': `${i * 0.55}s`
                } as CSSProperties;

                return (
                    <div
                        key={i}
                        className={`absolute ${active ? 'landing-levitate' : ''}`}
                        style={wrapStyle}
                    >
                        <Icon
                            className="h-full w-full"
                            style={{
                                opacity: tile.opacity,
                                transform: `rotate(${tile.rot}deg)`
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
}
