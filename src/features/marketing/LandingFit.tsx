import { useEffect, useRef, useState } from 'react';
import { FIT_DEMOS, FIT_POINTS } from './landingContent';
import { SettingsIcon, SwordIcon, UsersIcon, VideoIcon } from './landingIcons';
import { LandingReveal } from './LandingReveal';
import { LandingStage } from './LandingStage';

const NIGHTBOT_COLOR = '#1E90FF';
const STREAMER_COLOR = '#FF4500';

function ChatBadge({ role }: { role: 'viewer' | 'broadcaster' | 'bot' }) {
    if (role === 'bot') {
        return (
            <span
                className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-[0.2rem] text-white"
                style={{ backgroundColor: '#00ad03' }}
                title="Moderador"
            >
                <span className="sr-only">Moderador</span>
                <SwordIcon className="h-2.5 w-2.5" />
            </span>
        );
    }
    if (role === 'broadcaster') {
        return (
            <span
                className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-[0.2rem] text-white"
                style={{ backgroundColor: '#e91916' }}
                title="Streamer"
            >
                <span className="sr-only">Streamer</span>
                <VideoIcon className="h-2.5 w-2.5 fill-current" />
            </span>
        );
    }
    return null;
}

function ChatLine({
    user,
    color,
    text,
    role
}: {
    user: string;
    color: string;
    text: string;
    role: 'viewer' | 'broadcaster' | 'bot';
}) {
    return (
        <p className="px-4 py-0.5 text-[13px] leading-5 text-text-main">
            <ChatBadge role={role} />
            <span className="font-semibold" style={{ color }}>
                {user}
            </span>
            <span>: {text}</span>
        </p>
    );
}

type ChatPhase = 'typing' | 'sent' | 'reply';

export function LandingFit() {
    const [index, setIndex] = useState(0);
    const [run, setRun] = useState(0);
    const [typed, setTyped] = useState('');
    const [phase, setPhase] = useState<ChatPhase>('typing');
    const demo = FIT_DEMOS[index] ?? FIT_DEMOS[0];
    const skipTypeRef = useRef(false);

    useEffect(() => {
        skipTypeRef.current = false;
        setTyped('');
        setPhase('typing');
        const cmd = demo.command;
        let i = 0;
        let sendId = 0;
        const typeId = window.setInterval(() => {
            if (skipTypeRef.current) {
                window.clearInterval(typeId);
                return;
            }
            i += 1;
            setTyped(cmd.slice(0, i));
            if (i < cmd.length) return;
            window.clearInterval(typeId);
            sendId = window.setTimeout(() => {
                if (!skipTypeRef.current) setPhase('sent');
            }, 400);
        }, 55);
        return () => {
            window.clearInterval(typeId);
            window.clearTimeout(sendId);
        };
    }, [demo.command, index, run]);

    useEffect(() => {
        if (phase !== 'sent') return;
        const id = window.setTimeout(() => setPhase('reply'), 550);
        return () => window.clearTimeout(id);
    }, [phase]);

    const sendNow = () => {
        if (phase === 'typing') {
            skipTypeRef.current = true;
            setTyped(demo.command);
            setPhase('sent');
            return;
        }
        setRun((n) => n + 1);
    };

    return (
        <LandingStage id="encaja">
            <div className="mx-auto grid max-w-[1040px] items-stretch gap-10 md:grid-cols-2 md:gap-12">
                <LandingReveal className="flex flex-col justify-center">
                    <h2 className="text-3xl font-semibold tracking-tight text-text-main md:text-[2.25rem] md:leading-tight">
                        Solo copias y pegas
                    </h2>
                    <p className="mt-3 text-base leading-relaxed text-text-muted md:text-lg">
                        Sin instalar otro bot. El comando o la URL van a Nightbot, StreamElements, Streamlabs u OBS.
                    </p>
                    <ul className="mt-8 divide-y divide-border-subtle border-y border-border-subtle">
                        {FIT_POINTS.map((point) => (
                            <li key={point.title} className="py-4">
                                <p className="text-sm font-semibold text-text-main">{point.title}</p>
                                <p className="mt-1 text-sm leading-relaxed text-text-muted">{point.text}</p>
                            </li>
                        ))}
                    </ul>
                </LandingReveal>

                <LandingReveal className="h-full min-h-[380px]">
                    <div className="flex h-full min-h-[380px] flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-secondary">
                            <div className="relative flex items-center justify-center border-b border-border-subtle px-4 py-3">
                                <p className="text-[0.95rem] text-text-main">Chat del stream</p>
                                <UsersIcon className="absolute right-4 h-4 w-4 text-text-muted" />
                            </div>
                            <div className="border-b border-border-subtle px-3 py-2" role="tablist" aria-label="Probar comando">
                                <div className="flex rounded-lg bg-bg-main p-1">
                                    {FIT_DEMOS.map((item, i) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            role="tab"
                                            aria-selected={i === index}
                                            onClick={() => setIndex(i)}
                                            className={`min-w-0 flex-1 truncate rounded-md px-1.5 py-1.5 font-mono text-[0.68rem] font-medium transition sm:px-2 sm:text-[0.72rem] ${
                                                i === index
                                                    ? 'bg-primary/15 text-primary'
                                                    : 'text-text-muted hover:text-text-main'
                                            }`}
                                        >
                                            {item.command.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex min-h-0 flex-1 flex-col py-2">
                                <p className="px-4 py-1 text-[13px] leading-5 text-text-muted">
                                    ¡Te damos la bienvenida a la sala de chat de ponss17!
                                </p>
                                <ChatLine
                                    user="ponss17"
                                    color={STREAMER_COLOR}
                                    text="buenas"
                                    role="broadcaster"
                                />
                                {phase !== 'typing' ? (
                                    <div className="motion-safe:animate-fade-soft motion-reduce:animate-none">
                                        <ChatLine
                                            key={`${demo.id}-cmd-${run}`}
                                            user={demo.user}
                                            color={demo.color}
                                            text={demo.command}
                                            role={demo.role}
                                        />
                                    </div>
                                ) : null}
                                {phase === 'sent' ? (
                                    <p className="px-4 py-0.5 text-[13px] text-text-muted">
                                        Nightbot está escribiendo…
                                    </p>
                                ) : null}
                                {phase === 'reply' ? (
                                    <div className="motion-safe:animate-fade-soft motion-reduce:animate-none">
                                        <ChatLine
                                            key={`${demo.id}-bot-${run}`}
                                            user="Nightbot"
                                            color={NIGHTBOT_COLOR}
                                            text={demo.reply}
                                            role="bot"
                                        />
                                    </div>
                                ) : null}
                            </div>

                            <div className="px-3 pt-1 pb-3">
                                <div className="flex min-h-[42px] w-full items-center rounded-md border border-white/20 px-3 py-2.5 text-[13px]">
                                    {phase === 'typing' ? (
                                        <>
                                            <span className="text-text-main">{typed}</span>
                                            <span className="ml-px inline-block h-[1em] w-px bg-text-main motion-safe:animate-pulse" />
                                        </>
                                    ) : (
                                        <span className="text-text-muted">Enviar un mensaje</span>
                                    )}
                                </div>
                                <div className="mt-2.5 flex items-center justify-end gap-3">
                                    <SettingsIcon className="h-4 w-4 text-text-muted" />
                                    <button
                                        type="button"
                                        onClick={sendNow}
                                        className="rounded-md bg-primary px-4 py-1.5 text-[13px] font-medium text-white transition hover:bg-primary-hover"
                                    >
                                        Enviar
                                    </button>
                                </div>
                            </div>
                    </div>
                </LandingReveal>
            </div>
        </LandingStage>
    );
}
