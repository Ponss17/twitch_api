import { useEffect, useRef, useState } from 'react';
import { FIT_DEMOS, FIT_POINTS } from './landingContent';
import { SettingsIcon, SwordIcon, UsersIcon, VideoIcon } from './landingIcons';
import { LandingReveal } from './LandingReveal';
import { LandingFloatIcons } from './LandingMotif';

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
        <p className="px-4 py-1 text-[13px] leading-5 text-[#efeff1] hover:bg-[#1f1f23] transition-colors">
            <ChatBadge role={role} />
            <span className="font-semibold" style={{ color }}>
                {user}
            </span>
            <span className="text-[#efeff1]"> : {text}</span>
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
        <section id="encaja" className="relative scroll-mt-24 px-5 pt-16 pb-20 md:px-8 md:pt-24 md:pb-28 overflow-hidden">
            <LandingFloatIcons layout="c" side="left" />
            <div className="relative z-[1] mx-auto grid max-w-[1080px] items-center gap-10 md:grid-cols-2 md:gap-12">
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
                    <div className="flex h-full min-h-[380px] flex-col overflow-hidden rounded-lg border border-border-subtle bg-[#18181b]">
                            <div className="relative flex items-center justify-center border-b border-white/5 bg-[#18181b] px-4 py-3">
                                <div className="absolute left-4 opacity-50 hover:opacity-100 cursor-pointer transition-opacity">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                </div>
                                <p className="text-[13px] font-semibold uppercase tracking-widest text-[#efeff1]">Chat del stream</p>
                                <UsersIcon className="absolute right-4 h-[18px] w-[18px] text-[#adadb8]" />
                            </div>

                            <div className="border-b border-white/5 bg-[#18181b] px-3 py-2" role="tablist" aria-label="Probar comando">
                                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                                    {FIT_DEMOS.map((item, i) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            role="tab"
                                            aria-selected={i === index}
                                            onClick={() => setIndex(i)}
                                            className={`shrink-0 rounded-md px-3 py-1.5 font-mono text-[12px] font-semibold transition sm:text-[13px] ${
                                                i === index
                                                    ? 'bg-[#5c16c5] text-white shadow-sm'
                                                    : 'bg-[#1f1f23] text-[#adadb8] hover:bg-[#26262c] hover:text-[#efeff1]'
                                            }`}
                                        >
                                            {item.command.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex min-h-0 flex-1 flex-col py-2 bg-[#18181b]">
                                <p className="px-4 py-1 text-[13px] leading-5 text-[#adadb8]">
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
                                    <div className="h-6" aria-hidden />
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

                            <div className="px-4 pt-2 pb-4 bg-[#18181b]">
                                <div className="flex min-h-[40px] w-full items-center rounded-md border border-[#303032] bg-[#1f1f23] px-3 py-2 text-[13px] transition-all hover:border-[#464649] focus-within:border-[#a970ff] focus-within:bg-black focus-within:ring-1 focus-within:ring-[#a970ff]">
                                    {phase === 'typing' ? (
                                        <>
                                            <span className="text-[#efeff1]">{typed}</span>
                                            <span className="ml-px inline-block h-[1em] w-[2px] bg-[#efeff1] motion-safe:animate-pulse" />
                                        </>
                                    ) : (
                                        <span className="text-[#adadb8] font-medium">Enviar un mensaje</span>
                                    )}
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <div className="flex items-center gap-1.5 rounded-md hover:bg-[#26262c] p-1.5 cursor-pointer text-[#00f0ff] transition-colors" title="Puntos del canal">
                                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2l6 14-6-4-6 4 6-14z"/></svg>
                                            <span className="text-[12px] font-bold">1.2K</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <SettingsIcon className="h-[18px] w-[18px] text-[#adadb8] hover:text-[#efeff1] cursor-pointer transition-colors" />
                                        <button
                                            type="button"
                                            onClick={sendNow}
                                            className="rounded bg-[#9146ff] hover:bg-[#772ce8] px-3 py-1.5 text-[13px] font-semibold text-white transition-colors shadow-sm"
                                        >
                                            Chat
                                        </button>
                                    </div>
                                </div>
                            </div>
                    </div>
                </LandingReveal>
            </div>
        </section>
    );
}
