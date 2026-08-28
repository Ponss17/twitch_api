import { useEffect, useState } from 'react';
import { AppLogo } from '@/shared/ui/AppLogo';
import { TwitchIcon } from '@/shared/ui/icons/BrandIcons';

const GEN_OPTIONS = [
    { id: 'followage', label: 'Followage', cmd: '!followage $(touser)' },
    { id: 'watchtime', label: 'Watchtime', cmd: '!watchtime $(user)' },
    { id: 'clip', label: 'Clip', cmd: '!clip' },
    { id: 'so', label: 'Shoutout', cmd: '!so $(user)' }
] as const;
const BOTS = ['Nightbot', 'StreamElements', 'Streamlabs'] as const;

function stage(fill: boolean, extra = '') {
    return fill
        ? `flex h-[172px] flex-col items-center justify-center bg-bg-main p-4 ${extra}`
        : `mt-8 flex min-h-[148px] flex-col items-center justify-center rounded-xl border border-border-subtle bg-bg-main p-3 ${extra}`;
}

const CONNECT_DOTS = 8;
const CONNECT_TICK_MS = 280;
const CONNECT_HOLD_TICKS = 5;

export function VisualConnect({ fill = false }: { fill?: boolean }) {
    const [lit, setLit] = useState(0);

    useEffect(() => {
        let step = 0;
        const id = window.setInterval(() => {
            step += 1;
            if (step <= CONNECT_DOTS) {
                setLit(step);
                return;
            }
            if (step >= CONNECT_DOTS + CONNECT_HOLD_TICKS) {
                step = 0;
                setLit(0);
            }
        }, CONNECT_TICK_MS);
        return () => window.clearInterval(id);
    }, []);

    const connected = lit >= CONNECT_DOTS;

    return (
        <div
            className={`flex items-center justify-center gap-4 ${fill ? 'h-[172px] bg-bg-main px-5' : 'mt-8 min-h-[148px] rounded-xl border border-border-subtle bg-bg-main p-3'}`}
        >
            <TwitchIcon variant="brand" className="h-11 w-11 shrink-0" />
            <div className="flex w-[4.75rem] items-center justify-between sm:w-28" aria-hidden>
                {Array.from({ length: CONNECT_DOTS }, (_, i) => (
                    <span
                        key={i}
                        className={`size-1.5 rounded-full transition-colors duration-300 ${
                            i < lit
                                ? 'bg-primary shadow-[0_0_8px_var(--primary)]'
                                : 'bg-border-strong'
                        }`}
                    />
                ))}
            </div>
            <AppLogo
                className={`h-14 w-14 shrink-0 transition-[color,opacity] duration-500 ${
                    connected ? 'text-primary opacity-100' : 'text-text-muted opacity-35'
                }`}
                aria-hidden
            />
        </div>
    );
}

export function VisualGenerate({ fill = false }: { fill?: boolean }) {
    const [index, setIndex] = useState(0);
    const [copied, setCopied] = useState(false);
    const option = GEN_OPTIONS[index] ?? GEN_OPTIONS[0];

    useEffect(() => {
        setCopied(false);
        const copyAt = window.setTimeout(() => setCopied(true), 1100);
        const nextAt = window.setTimeout(() => {
            setIndex((prev) => (prev + 1) % GEN_OPTIONS.length);
        }, 2800);
        return () => {
            window.clearTimeout(copyAt);
            window.clearTimeout(nextAt);
        };
    }, [index]);

    return (
        <div className={stage(fill, 'w-full gap-2.5')}>
            <div className="flex flex-wrap justify-center gap-1">
                {GEN_OPTIONS.map((item, i) => (
                    <span
                        key={item.id}
                        className={`rounded-md px-2 py-1 text-[0.68rem] font-medium transition-colors duration-300 ${
                            i === index ? 'bg-primary/15 text-text-main' : 'text-text-muted'
                        }`}
                    >
                        {item.label}
                    </span>
                ))}
            </div>
            <div className="flex w-full items-center gap-2 rounded-lg border border-border-subtle bg-bg-secondary px-2.5 py-2">
                <p
                    key={option.cmd}
                    className="min-w-0 flex-1 truncate font-mono text-[0.72rem] text-text-main opacity-0 motion-safe:animate-fade-soft"
                >
                    {option.cmd}
                </p>
                <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-[0.65rem] font-semibold transition-colors duration-300 ${
                        copied ? 'bg-primary/15 text-primary' : 'text-text-muted'
                    }`}
                >
                    {copied ? 'Copiado' : 'Copiar'}
                </span>
            </div>
        </div>
    );
}

export function VisualBots({ fill = false }: { fill?: boolean }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const id = window.setInterval(() => {
            setIndex((prev) => (prev + 1) % BOTS.length);
        }, 2400);
        return () => window.clearInterval(id);
    }, []);

    return (
        <div className={stage(fill, 'w-full gap-3')}>
            <p className="font-mono text-[0.72rem] text-primary">!followage</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
                {BOTS.map((name, i) => (
                    <span
                        key={name}
                        className={`rounded-lg border px-2.5 py-1.5 text-[0.72rem] font-medium transition-colors duration-500 ${
                            i === index
                                ? 'border-primary/40 bg-primary/10 text-text-main'
                                : 'border-border-subtle bg-bg-secondary text-text-muted'
                        }`}
                    >
                        {name}
                    </span>
                ))}
            </div>
        </div>
    );
}

export function LandingVisual({ id, fill = false }: { id: string; fill?: boolean }) {
    switch (id) {
        case 'connect':
            return <VisualConnect fill={fill} />;
        case 'generate':
            return <VisualGenerate fill={fill} />;
        case 'bots':
            return <VisualBots fill={fill} />;
        default:
            return null;
    }
}
