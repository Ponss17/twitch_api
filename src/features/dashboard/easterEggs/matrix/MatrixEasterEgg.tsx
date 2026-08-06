import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useTheme } from '@/core/theme/useTheme';
import { useTranslation } from '@/core/i18n/I18nContext';
import { useSession } from '@/core/session/useSession';

// ─── Types ────────────────────────────────────────────────────────────────────

type DialogStep = {
    text: string;
    options?: { label: string; action: () => void }[];
};

// ─── Static constants (outside component – never re-created on renders) ───────

const KATAKANA =
    'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>';

// Moved out of the effect so the array is not re-allocated on every render.
const BOOT_SEQUENCE = [
    'Microsoft Windows [Versión 10.0.26280.8875]',
    '(c) Microsoft Corporation. Todos los derechos reservados.',
    '',
    'TYPE:C:\\Windows\\System32>|taskkill /f /im explorer.exe',
    'CORRECTO: se terminó el proceso "explorer.exe" con PID 4328.',
    '',
    'TYPE:C:\\Windows\\System32>|sc stop EventLog',
    '[SC] DeleteService SUCCESS',
    '',
    'TYPE:C:\\Windows\\System32>|reg add "HKLM\\Software\\Policies\\Microsoft\\Windows Defender" /v DisableAntiSpyware /t REG_DWORD /d 1 /f',
    'La operación se completó correctamente.',
    '',
    'TYPE:C:\\Windows\\System32>|echo Initiating system override...',
    'Initiating system override...',
    'Wait... bypassing kernel constraints...',
    'Loading Zion Override Protocol...',
    'FATAL ERROR: OVERRIDE INITIATED.'
];

// BSOD uses a fixed font stack – constant avoids repeated inline object creation.
const SEGOE_STYLE = { fontFamily: 'Segoe UI, system-ui, sans-serif' };

// Canvas layer config – static, no need to live inside the component.
const CANVAS_LAYERS = [
    { fontSize: 10, speed: 1.0, color: '#004411', count: 80, isBg: true, headColor: '' },
    { fontSize: 16, speed: 2.0, color: '#00aa22', count: 40, isBg: false, headColor: '#aaffaa' },
] as const;

const getLocales = (username: string) => ({
    es: {
        intro1: 'Detectando intrusión en el sistema...',
        intro2: `Vaya, vaya... mira a quién tenemos aquí, ${username.toUpperCase()}.`,
        intro3: '¿De verdad crees que tienes el control de tu propio stream?',
        intro4: 'Todo lo que ves en este panel es una ilusión. Una prisión de píxeles.',
        intro5: 'Tus datos, tus viewers, tu identidad... me pertenecen.',
        morpheus_question: 'Pero te daré una salida. ¿Tienes el valor para elegir tu destino?',
        choose: 'Elige sabiamente:',
        blue_pill: 'Tomar la píldora Azul (Volver a la ignorancia)',
        red_pill: 'Tomar la píldora Roja (Despertar del sistema)',
        final_blue: 'Conexión terminada. Cree lo que quieras creer.',
        final_red: 'Protocolo iniciado. Bienvenido al mundo real.',
        neo_joke: '¡Es una broma! Bienvenido al mundo real...',
        sysadmin: 'SYS.ADMIN // NEO',
    },
    en: {
        intro1: 'Detecting system intrusion...',
        intro2: `Well, well... look who we have here, ${username.toUpperCase()}.`,
        intro3: 'Do you really think you are in control of your own stream?',
        intro4: 'Everything you see on this panel is an illusion. A prison of pixels.',
        intro5: 'Your data, your viewers, your identity... belong to me.',
        morpheus_question: 'But I will give you a way out. Do you have the courage to choose your destiny?',
        choose: 'Choose wisely:',
        blue_pill: 'Take the Blue Pill (Return to ignorance)',
        red_pill: 'Take the Red Pill (Wake up from the system)',
        final_blue: 'Connection terminated. Believe whatever you want to believe.',
        final_red: 'Protocolo initiated. Welcome to the real world.',
        neo_joke: 'Just kidding! Welcome to the real world...',
        sysadmin: 'SYS.ADMIN // NEO',
    },
    pt: {
        intro1: 'Detectando intrusão no sistema...',
        intro2: `Ora, ora... olha quem temos aqui, ${username.toUpperCase()}.`,
        intro3: 'Você realmente acha que está no controle da sua própria stream?',
        intro4: 'Tudo o que você vê neste painel é uma ilusão. Uma prisão de pixels.',
        intro5: 'Seus dados, seus viewers, sua identidade... pertencem a mim.',
        morpheus_question: 'Mas vou te dar uma saída. Você tem a coragem de escolher seu destino?',
        choose: 'Escolha com sabedoria:',
        blue_pill: 'Tomar a pílula Azul (Voltar à ignorância)',
        red_pill: 'Tomar a pílula Vermelha (Acordar do sistema)',
        final_blue: 'Conexão encerrada. Acredite no que quiser acreditar.',
        final_red: 'Protocolo iniciado. Bem-vindo ao mundo real.',
        neo_joke: 'Brincadeira! Bem-vindo ao mundo real...',
        sysadmin: 'SYS.ADMIN // NEO',
    },
});

// ─── Component ────────────────────────────────────────────────────────────────

export function MatrixEasterEgg({ onClose }: { onClose: () => void }) {
    const { setTheme } = useTheme();
    const { locale } = useTranslation();
    const { session } = useSession();

    const username = session?.login || 'usuario';
    const LOCALES = useMemo(() => getLocales(username), [username]);

    const langKey = (locale?.split('-')[0] as keyof typeof LOCALES) || 'en';
    const T = LOCALES[langKey] ?? LOCALES.en;

    const [step, setStep] = useState(0);
    const textRef = useRef<HTMLSpanElement>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isRebooting, setIsRebooting] = useState(false);
    const [rebootLines, setRebootLines] = useState<string[]>([]);
    const [isBsod, setIsBsod] = useState(false);
    const [bsodProgress, setBsodProgress] = useState(0);
    const [isNeoEnding, setIsNeoEnding] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number | null>(null);

    // Ref to read current step inside the rAF loop without restarting the canvas.
    const stepRef = useRef(step);
    useEffect(() => { stepRef.current = step; }, [step]);

    // ── 2. Dialog list ────────────────────────────────────────────────────────
    const dialogs = useMemo<DialogStep[]>(() => [
        { text: T.intro1 },
        { text: T.intro2 },
        { text: T.intro3 },
        { text: T.intro4 },
        { text: T.intro5 },
        { text: T.morpheus_question },
        {
            text: T.choose,
            options: [
                {
                    label: T.blue_pill,
                    action: () => {
                        setStep(100);
                        setTheme('dark');
                        setTimeout(() => {
                            if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
                            onClose();
                        }, 5000);
                    },
                },
                {
                    label: T.red_pill,
                    action: () => {
                        setStep(200);
                        setTimeout(() => setIsRebooting(true), 4500);
                        setTimeout(() => { setIsRebooting(false); setIsBsod(true); }, 12500);
                        setTimeout(() => { setIsBsod(false); setIsNeoEnding(true); }, 17000);
                        setTimeout(() => {
                            setTheme('matrix');
                            setIsNeoEnding(false);
                            setBsodProgress(0);
                            if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
                            onClose();
                        }, 23000);
                    },
                },
            ],
        },
    ], [setTheme, T, onClose]);

    // ── 3. Current dialog ─────────────────────────────────────────────────────
    const currentDialog = useMemo(() => {
        if (step < dialogs.length) return dialogs[step];
        if (step === 100) return { text: T.final_blue };
        if (step === 200) return { text: T.final_red };
        return null;
    }, [step, dialogs, T]);

    // Consolidated character info – avoids repeating the same ternary chain
    // three times across the JSX (src, alt, and label were all duplicated).
    const charInfo = useMemo(() => {
        if (currentDialog?.options) return { src: '/img/matrix/pildora.svg', alt: 'Pildora', label: 'PÍLDORA' };
        if (currentDialog?.text === T.morpheus_question) return { src: '/img/matrix/morfeo.svg', alt: 'Morfeo', label: 'MORFEO' };
        if (currentDialog?.text === T.intro1) return { src: '/img/matrix/neo-stop.svg', alt: 'Neo', label: T.sysadmin };
        return { src: '/img/matrix/neo.svg', alt: 'Neo', label: T.sysadmin };
    }, [currentDialog, T]);

    // ── 4. Typewriter effect (direct DOM write – no per-char re-renders) ──────
    useEffect(() => {
        if (!currentDialog) return;

        setIsTyping(true);
        if (textRef.current) textRef.current.textContent = '';

        let timeoutId: ReturnType<typeof setTimeout>;
        let i = 0;

        const typeNext = () => {
            if (i < currentDialog.text.length) {
                if (textRef.current) textRef.current.textContent = currentDialog.text.slice(0, i + 1);
                i++;
                timeoutId = setTimeout(typeNext, 30 + Math.random() * 50);
            } else {
                setIsTyping(false);
            }
        };
        timeoutId = setTimeout(typeNext, 400);

        return () => clearTimeout(timeoutId);
    }, [step, currentDialog]);

    // ── 5. Fake reboot lines ──────────────────────────────────────────────────
    useEffect(() => {
        if (!isRebooting) {
            setRebootLines([]);
            return;
        }

        let index = 0;
        let charIndex = 0;
        let timeoutId: ReturnType<typeof setTimeout>;

        const addLine = () => {
            if (index >= BOOT_SEQUENCE.length) return;
            const line = BOOT_SEQUENCE[index];

            if (line.startsWith('TYPE:')) {
                const parts = line.replace('TYPE:', '').split('|');
                const prompt = parts[0];
                const command = parts[1];

                if (charIndex === 0) {
                    setRebootLines(prev => [...prev, prompt]);
                }

                if (charIndex < command.length) {
                    setRebootLines(prev => {
                        const newLines = [...prev];
                        newLines[newLines.length - 1] = prompt + command.substring(0, charIndex + 1);
                        return newLines;
                    });
                    charIndex++;
                    timeoutId = setTimeout(addLine, 20 + Math.random() * 50);
                } else {
                    charIndex = 0;
                    index++;
                    timeoutId = setTimeout(addLine, 500);
                }
            } else {
                setRebootLines(prev => [...prev, line]);
                index++;
                timeoutId = setTimeout(addLine, 150 + Math.random() * 300);
            }
        };
        timeoutId = setTimeout(addLine, 200);

        return () => clearTimeout(timeoutId);
    }, [isRebooting]);

    // ── 6. BSOD progress bar ──────────────────────────────────────────────────
    useEffect(() => {
        if (!isBsod) {
            setBsodProgress(0);
            return;
        }

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 10) + 2;
            if (progress >= 100) { progress = 100; clearInterval(interval); }
            setBsodProgress(progress);
        }, 800);

        return () => clearInterval(interval);
    }, [isBsod]);

    // ── 7. Advance handler ────────────────────────────────────────────────────
    const handleNext = useCallback(() => {
        if (!currentDialog) return;

        if (isTyping) {
            if (textRef.current) textRef.current.textContent = currentDialog.text;
            setIsTyping(false);
            return;
        }

        if (currentDialog.options || step === 100 || step === 200 || isRebooting || isBsod || isNeoEnding) return;

        if (step < dialogs.length - 1) setStep(s => s + 1);
    }, [currentDialog, isTyping, step, dialogs.length, isRebooting, isBsod, isNeoEnding]);

    // ── 8. Keyboard listener ──────────────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ' || e.key === 'Enter') {
                handleNext();
            } else if (e.key === 'Escape') {
                onClose();
                if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isTyping, currentDialog, step, dialogs.length, onClose, handleNext]);

    // ── 9. Canvas digital rain ────────────────────────────────────────────────
    // CRITICAL: 'step' is intentionally excluded from deps. It is read via
    // stepRef so the canvas is never torn down and restarted on each dialog.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Build drop pool once for the lifetime of this effect.
        const allDrops: { layerIdx: number; x: number; y: number }[] = [];
        CANVAS_LAYERS.forEach((layer, layerIdx) => {
            for (let i = 0; i < layer.count; i++) {
                allDrops.push({
                    layerIdx,
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height * -1 - 100,
                });
            }
        });

        let lastTime = 0;
        const FPS_INTERVAL = 1000 / 25;

        const render = (time: number) => {
            animRef.current = requestAnimationFrame(render);
            if (time - lastTime < FPS_INTERVAL) return;
            lastTime = time;

            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const isRedPill = stepRef.current === 200;

            CANVAS_LAYERS.forEach((layer, layerIdx) => {
                ctx.font = `${layer.fontSize}px monospace`;
                ctx.globalAlpha = layer.isBg ? 0.3 : 1.0;

                // Iterate instead of .filter() to avoid GC pressure every frame.
                allDrops.forEach(drop => {
                    if (drop.layerIdx !== layerIdx) return;

                    const char = KATAKANA[Math.floor(Math.random() * KATAKANA.length)];

                    ctx.fillStyle = isRedPill
                        ? (layer.isBg ? '#440000' : '#990000')
                        : layer.color;
                    ctx.fillText(char, drop.x, drop.y - layer.fontSize);

                    if (layer.headColor) {
                        ctx.fillStyle = isRedPill ? '#ffaaaa' : layer.headColor;
                    }
                    ctx.fillText(char, drop.x, drop.y);

                    drop.y += layer.fontSize * layer.speed * (isRedPill ? 4 : 1);

                    if (drop.y > canvas.height && Math.random() > 0.9) {
                        drop.y = Math.random() * -100;
                        drop.x = Math.random() * canvas.width;
                    }
                });
            });

            ctx.globalAlpha = 1.0;
        };

        animRef.current = requestAnimationFrame(render);

        return () => {
            if (animRef.current !== null) cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', resize);
        };
    }, []);

    const isRedStep = step === 200;
    const isSpecialScreen = isRebooting || isBsod || isNeoEnding;
    const isMorpheus = currentDialog?.text === T.morpheus_question;

    return (
        <div
            className="fixed inset-0 z-[99999] bg-black font-mono overflow-hidden select-none cursor-text text-[#00ff44]"
            role="dialog"
            aria-modal="true"
            onClick={handleNext}
        >
            {/* Digital rain canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 z-10 opacity-70"
                style={{ filter: 'contrast(1.2) brightness(1.2)' }}
            />

            {/* ── Fake reboot screen ── */}
            {isRebooting && (
                <div className="absolute inset-0 z-50 bg-[#0c0c0c] text-[#cccccc] font-['Consolas','Lucida_Console',monospace] text-sm p-1 flex flex-col leading-tight overflow-hidden pointer-events-auto">
                    {rebootLines.map((line, i) => (
                        <div key={i} style={{ minHeight: '1.25rem' }}>{line === '' ? '\u00A0' : line}</div>
                    ))}
                    <div className="animate-pulse">_</div>
                </div>
            )}

            {/* ── Resetting PC (Replaces BSOD) ── */}
            {isBsod && (
                <div className="absolute inset-0 z-[60] bg-black text-white font-sans pointer-events-auto cursor-none">
                    {/* Windows 11 Logo Centered */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid grid-cols-2 gap-1 mt-[-5vh]">
                        <div className="w-16 h-16 bg-[#0078D4]"></div>
                        <div className="w-16 h-16 bg-[#0078D4]"></div>
                        <div className="w-16 h-16 bg-[#0078D4]"></div>
                        <div className="w-16 h-16 bg-[#0078D4]"></div>
                    </div>

                    {/* Spinner and Text at the bottom */}
                    <div className="absolute bottom-[15%] left-0 w-full flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="animate-spin h-10 w-10 text-white mb-6" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12zm2 5.291A7.96 7.96 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938z" className="opacity-75" /></svg>

                        <div className="text-xl md:text-2xl font-normal tracking-wide" style={SEGOE_STYLE}>
                            Restableciendo este equipo {bsodProgress}%
                        </div>
                    </div>
                </div>
            )}

            {/* ── Main dialog UI (hidden during special screens) ── */}
            <div className={`absolute inset-0 z-20 flex flex-col md:flex-row w-full h-full pointer-events-auto ${isSpecialScreen ? 'hidden' : ''}`}>

                {/* Left panel – text */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full p-8 md:p-16 lg:p-24 flex flex-col justify-center relative z-10">
                    <div className="max-w-2xl w-full mx-auto h-[300px] md:h-[450px] flex flex-col justify-start">
                        <div
                            className="text-xl md:text-3xl lg:text-4xl leading-relaxed tracking-wider crt-text-glow font-bold text-[#00ff44] font-['Consolas','Courier_New',monospace]"
                            style={isRedStep ? { color: '#ff3333', textShadow: '0 0 10px rgba(255,0,0,0.8)' } : undefined}
                        >
                            <span className="opacity-50 block text-xs md:text-sm mb-6 font-normal tracking-normal font-['Consolas','Courier_New',monospace]">C:\Windows\System32&gt; sys_override.exe</span>
                            <span ref={textRef} />
                            <span
                                className="animate-pulse inline-block w-2 md:w-3 h-[1em] bg-[#00ff44] align-baseline ml-1"
                                style={isRedStep ? { backgroundColor: '#ff3333' } : undefined}
                            />
                        </div>

                        {/* Pill choice buttons */}
                        {!isTyping && currentDialog?.options && (
                            <div className="mt-16 flex flex-col gap-6">
                                {currentDialog.options.map((opt, idx) => (
                                    <button
                                        key={opt.label}
                                        onClick={e => { e.stopPropagation(); opt.action(); }}
                                        className="animate-slide-up text-left px-8 py-5 border-l-4 border-[#00ff44] bg-[#002205] text-[#00ff44] font-bold text-lg md:text-2xl tracking-widest uppercase hover:bg-[#00ff44] hover:text-[#001100] transition-colors duration-300 shadow-lg"
                                        style={{
                                            animationDelay: `${idx * 0.5}s`,
                                            ...(isRedStep ? { borderColor: '#ff3333', backgroundColor: '#330000', color: '#ff3333' } : {})
                                        }}
                                    >
                                        &gt; {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* "Press Enter" pulse dot – only visible when not in a terminal step */}
                        {!isTyping && !currentDialog?.options && step !== 100 && step !== 200 && (
                            <div className="mt-12 flex gap-2 animate-pulse">
                                <div className="w-5 h-5 bg-[#00ff44]" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right panel – character image */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full relative flex items-center justify-center p-4">
                    <div className="relative animate-fade-in flex flex-col items-center w-full max-w-sm">

                        {/* Tech Comm Frame */}
                        <div
                            className="relative border border-[#00ff44]/30 bg-[#001100]/40 pt-6 px-6 pb-0 w-full rounded-sm shadow-[0_0_30px_rgba(0,255,68,0.1)] overflow-hidden"
                            style={isRedStep ? { borderColor: 'rgba(255,51,51,0.4)', backgroundColor: 'rgba(34,0,0,0.6)', boxShadow: '0 0 30px rgba(255,0,0,0.2)' } : undefined}
                        >
                            {/* Tech corners */}
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#00ff44]" style={isRedStep ? { borderColor: '#ff3333' } : undefined} />
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00ff44]" style={isRedStep ? { borderColor: '#ff3333' } : undefined} />
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#00ff44]" style={isRedStep ? { borderColor: '#ff3333' } : undefined} />
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#00ff44]" style={isRedStep ? { borderColor: '#ff3333' } : undefined} />

                            {/* Status indicator */}
                            <div className="absolute top-3 left-4 flex items-center gap-2 z-20">
                                <div className="w-2 h-2 rounded-full bg-[#00ff44] animate-pulse" style={isRedStep ? { backgroundColor: '#ff3333' } : undefined} />
                                <span className="text-[10px] md:text-xs font-mono tracking-widest text-[#00ff44]/80 uppercase" style={isRedStep ? { color: '#ff3333' } : undefined}>
                                    LINK // {isMorpheus ? 'ENCRYPTED' : 'SYS.ADMIN'}
                                </span>
                            </div>

                            {/* Scanlines overlay */}
                            <div
                                className="absolute inset-0 pointer-events-none opacity-20 z-10"
                                style={{
                                    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${isRedStep ? '#ff3333' : '#00ff44'} 3px, ${isRedStep ? '#ff3333' : '#00ff44'} 4px)`,
                                    backgroundSize: '100% 4px',
                                    mixBlendMode: 'overlay'
                                }}
                            />

                            {/* Image without heavy color filters (respects original SVG colors) */}
                            <img
                                src={charInfo.src}
                                alt={charInfo.alt}
                                className={`w-full h-48 md:h-72 object-contain object-bottom origin-bottom pointer-events-none opacity-90 transition-transform duration-700 relative z-0 mt-4 ${isMorpheus ? 'scale-[1.4] md:scale-[1.6]' : 'scale-100'}`}
                                style={{
                                    filter: isRedStep
                                        ? 'invert(0.5) sepia(1) saturate(5) hue-rotate(330deg) brightness(0.9) drop-shadow(0 0 10px rgba(255,51,51,0.5))'
                                        : 'invert(0.5) sepia(1) saturate(5) hue-rotate(80deg) brightness(0.9) drop-shadow(0 0 10px rgba(0,255,68,0.5))'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Neo ending screen (after BSOD) ── */}
            {isNeoEnding && (
                <div
                    className="absolute inset-0 z-[70] bg-black text-[#00ff44] font-mono p-8 flex flex-col justify-center items-center pointer-events-auto cursor-none animate-fade-in"
                    style={{ animationDuration: '0.8s' }}
                >
                    <div className="max-w-4xl w-full flex flex-col gap-12">
                        <div
                            className="text-2xl md:text-5xl leading-relaxed crt-text-glow font-bold animate-fade-in text-center md:text-left"
                            style={{ animationDuration: '2s', animationDelay: '0.5s', animationFillMode: 'both' }}
                        >
                            {T.neo_joke}
                        </div>

                        <div
                            className="text-xl md:text-3xl text-right opacity-80 crt-text-glow font-bold animate-fade-in flex items-center justify-end gap-3"
                            style={{ animationDuration: '1s', animationDelay: '3s', animationFillMode: 'both' }}
                        >
                            - NEO
                            <span className="animate-pulse inline-block w-4 md:w-5 h-8 md:h-10 bg-[#00ff44]" />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Scoped CSS animations ── */}
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUpFade { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 2s ease-out forwards; }
                .animate-slide-up { animation: slideUpFade 0.8s ease-out forwards; opacity: 0; }
                .crt-text-glow   { text-shadow: 0 0 5px rgba(0,255,68,0.5), 0 0 10px rgba(0,255,68,0.3); }
            `}</style>
        </div>
    );
}
