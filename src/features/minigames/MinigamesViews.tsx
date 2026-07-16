import { CardHeaderIcon } from '@/shared/ui/Icon';
import { Loader2, Gem, Swords, Check, AlertTriangle, Play, Gavel, Skull, type LucideIcon } from 'lucide-react';
import { MAGIC8_ICON, RUSSIAN_ICON } from '@/features/dashboard/lib/dashboardTabs';

import { useState, type ReactNode } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import { authHeaders, withApiCredentials } from '@/core/api/auth';
import { fetchWithRetry } from '@/core/api/fetchWithRetry';
import { useRequiredSession } from '@/core/session/useSession';
import { COMMAND_CONFIG } from '@/features/commands/lib/config';
import {
    btnPrimary,
    card,
    fadeIn,
    formGrid,
    formGroupLabel,
    gameResponseCard,
    textInput
} from '@/core/utils/tw';
import { CommandGeneratorCard } from '@/features/commands/CommandGeneratorCard';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { extractApiErrorMessage, formatApiErrorForUi } from '@/core/api/apiError';


type TestResult = { status: 'idle' | 'loading' | 'success' | 'error'; message: string };

const TWITCH_LOGIN = /^@?[a-zA-Z0-9_]{1,25}$/;

function normalizeTwitchLogin(raw: string): string {
    return raw.trim().replace(/^@+/, '');
}

function parseApiError(text: string): string {
    try {
        return formatApiErrorForUi(extractApiErrorMessage(JSON.parse(text) as unknown, text));
    } catch {
        return formatApiErrorForUi(text);
    }
}

export function MinigameCard({
    icon: Icon,
    title,
    description,
    info,
    children,
    staggered = false,
    centerBody = false
}: {
    icon: LucideIcon;
    title: string;
    description: string;
    info?: string;
    children: ReactNode;
    staggered?: boolean;
    centerBody?: boolean;
}) {
    return (
        <div
            className={`${card} ${fadeIn} mb-3 opacity-0 ${staggered ? '[animation-delay:120ms]' : ''}`}
        >
            <div className="mb-2 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2">
                <div className="flex items-center gap-3">
                    <CardHeaderIcon icon={Icon} />
                    <div>
                        <h3 className="mb-0.5 text-[0.95rem] font-bold">{title}</h3>
                        <p className="text-[0.8rem] text-[#c4c4cc]">{description}</p>
                    </div>
                </div>
                {info && (
                    <div className="shrink-0">
                        <InfoTooltip text={info} />
                    </div>
                )}
            </div>
            <div className={`text-[#fafafa] ${centerBody ? 'text-center' : ''}`}>{children}</div>
        </div>
    );
}

function GameResponse({
    result,
    loadingNode,
    successIcon: SuccessIcon = Check,
    errorIcon: ErrorIcon = AlertTriangle
}: {
    result: TestResult;
    loadingNode?: ReactNode;
    successIcon?: LucideIcon;
    errorIcon?: LucideIcon;
}) {
    const isActive = result.status === 'success' || result.status === 'error';
    if (!isActive && result.status !== 'loading') return null;

    const success = result.status === 'success';
    const loading = result.status === 'loading';

    return (
        <div
            className={`${gameResponseCard} animate-reveal-card ${
                loading
                    ? 'border-white/[0.08] bg-[rgba(15,23,42,0.6)] text-[#fafafa]'
                    : success
                      ? 'border-success/30 bg-[rgba(16,185,129,0.15)] text-success'
                      : 'border-error/30 bg-error/15 text-error'
            }`}
        >
            {loading && loadingNode}
            {success && (
                <SuccessIcon className="text-lg" aria-hidden="true" />
            )}
            {result.status === 'error' && (
                <ErrorIcon
                    className="text-lg"
                    aria-hidden="true"
                />
            )}
            {!loading && <div className="min-w-0 flex-1">{result.message}</div>}
        </div>
    );
}

export function Magic8View() {
    const session = useRequiredSession();
    const [question, setQuestion] = useState('');
    const [commandExtras, setCommandExtras] = useState<Record<string, string>>({});
    const [result, setResult] = useState<TestResult>({ status: 'idle', message: '' });

    const ask = async () => {
        if (!question.trim()) {
            setResult({ status: 'error', message: 'Debes hacer una pregunta primero.' });
            return;
        }

        setResult({ status: 'loading', message: '' });
        const mood = commandExtras.mood || 'classic';

        try {
            const url = `${API_ENDPOINTS.MAGIC8}?question=${encodeURIComponent(question)}&mood=${mood}&user=${encodeURIComponent(session.login ?? '')}&_nocache=${Date.now()}`;
            const res = await fetchWithRetry(url, withApiCredentials({ headers: authHeaders(session) }));
            const text = await res.text();
            setResult({ status: res.ok ? 'success' : 'error', message: res.ok ? text : parseApiError(text) });
            if (res.ok) setQuestion('');
        } catch (e) {
            setResult({ status: 'error', message: (e as Error).message });
        }
    };

    return (
        <>
            <CommandGeneratorCard
                config={COMMAND_CONFIG.magic8}
                onExtraValuesChange={setCommandExtras}
            />
            <MinigameCard
                icon={MAGIC8_ICON}
                title="Prueba la Bola 8"
                description="Verifica que la IA responda correctamente"
                info="Haz una pregunta directamente aquí para ver cómo respondería la IA en tu chat."
                staggered
            >
                <div className={formGrid}>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="magic8-question" className={formGroupLabel}>
                            Tu pregunta
                        </label>
                        <input
                            id="magic8-question"
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && void ask()}
                            placeholder="Ej: ella me quiere, ¿debo streamear hoy?"
                            className={textInput}
                            disabled={result.status === 'loading'}
                        />
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => void ask()}
                    disabled={result.status === 'loading'}
                    className={`${btnPrimary} mt-5`}
                >
                    {result.status === 'loading' ? <Loader2 className="animate-spin" /> : <Play className="w-4 h-4" />}
                    {result.status === 'loading' ? 'Consultando...' : 'Preguntar'}
                </button>
                <GameResponse
                    result={result}
                    loadingNode={
                        <div className="flex items-center gap-3 font-medium text-primary italic">
                            <Gem className="animate-pulse text-[1.8rem]" />
                            Consultando a los espíritus...
                        </div>
                    }
                />
            </MinigameCard>
        </>
    );
}

export function DuelView() {
    const session = useRequiredSession();
    const [target, setTarget] = useState('');
    const [challenger, setChallenger] = useState('');
    const [result, setResult] = useState<TestResult>({ status: 'idle', message: '' });

    const fight = async () => {
        const targetLogin = normalizeTwitchLogin(target);
        const challengerLogin = normalizeTwitchLogin(challenger);

        if (!targetLogin) {
            setResult({ status: 'error', message: 'Debes especificar un oponente.' });
            return;
        }

        if (!TWITCH_LOGIN.test(targetLogin) || (challengerLogin && !TWITCH_LOGIN.test(challengerLogin))) {
            setResult({
                status: 'error',
                message:
                    'Usa el login de Twitch (sin espacios). Ej: pepe_grillo — no el nombre visible con espacios.'
            });
            return;
        }

        setResult({ status: 'loading', message: '' });

        try {
            const params = new URLSearchParams({ target: targetLogin });
            if (challengerLogin) params.set('challenger', challengerLogin);
            params.set('_nocache', Date.now().toString());
            const url = `${API_ENDPOINTS.DUEL}?${params}`;
            const res = await fetchWithRetry(url, withApiCredentials({ headers: authHeaders(session) }));
            const text = await res.text();
            setResult({
                status: res.ok ? 'success' : 'error',
                message: res.ok ? text : parseApiError(text)
            });
        } catch (e) {
            setResult({ status: 'error', message: (e as Error).message });
        }
    };

    return (
        <>
            <CommandGeneratorCard config={COMMAND_CONFIG.duel} />
            <MinigameCard
                icon={Swords}
                title="Duelo 1vs1"
                description="Simula un duelo 1vs1 rápido"
                info="Prueba el comando !duelo directamente desde aquí."
                staggered
            >
                <div className={formGrid}>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="duel-target" className={formGroupLabel}>
                            Oponente (Usuario)
                        </label>
                        <input
                            id="duel-target"
                            type="text"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && void fight()}
                            placeholder="Ej: nightbot (login, sin espacios)"
                            className={textInput}
                            disabled={result.status === 'loading'}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="duel-challenger" className={formGroupLabel}>
                            Retador (Opcional)
                        </label>
                        <input
                            id="duel-challenger"
                            type="text"
                            value={challenger}
                            onChange={(e) => setChallenger(e.target.value)}
                            placeholder="Tu login (opcional)"
                            className={textInput}
                            disabled={result.status === 'loading'}
                        />
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => void fight()}
                    disabled={result.status === 'loading'}
                    className={`${btnPrimary} mt-5`}
                >
                    {result.status === 'loading' ? <Loader2 className="animate-spin" /> : <Gavel className="w-4 h-4" />}
                    {result.status === 'loading' ? 'Peleando...' : '¡DUELO!'}
                </button>
                <GameResponse
                    result={result}
                    loadingNode={
                        <div className="flex items-center gap-3 font-medium text-[#f97316] italic">
                            <Swords className="animate-[gunShake_1s_infinite_linear] text-[1.8rem]" />
                            Calculando ganador...
                        </div>
                    }
                />
            </MinigameCard>
        </>
    );
}

export function RussianView() {
    const session = useRequiredSession();
    const [result, setResult] = useState<TestResult>({ status: 'idle', message: '' });
    const [gunDead, setGunDead] = useState(false);
    const [gunSuccess, setGunSuccess] = useState(false);
    const loading = result.status === 'loading';

    const pullTrigger = async () => {
        setResult({ status: 'loading', message: '' });
        setGunDead(false);
        setGunSuccess(false);

        try {
            const url = `${API_ENDPOINTS.BASE}/minigames/russian?user=${encodeURIComponent(session.login ?? '')}&channel=${encodeURIComponent(session.login ?? '')}&hardcore=false&format=json&_nocache=${Date.now()}`;
            const res = await fetchWithRetry(url, withApiCredentials({ headers: authHeaders(session) }));
            if (res.ok) {
                const data = (await res.json()) as { status?: string; message: string };
                const dead = data.status === 'dead';
                setResult({ status: dead ? 'error' : 'success', message: data.message });
                if (dead) {
                    setGunDead(true);
                    window.setTimeout(() => setGunDead(false), 3000);
                } else {
                    setGunSuccess(true);
                    window.setTimeout(() => setGunSuccess(false), 3000);
                }
            } else {
                const err = await res.text();
                setResult({ status: 'error', message: err ? parseApiError(err) : 'Error desconocido' });
            }
        } catch {
            setResult({ status: 'error', message: 'La pistola se encasquilló (Error de API)' });
        }
    };

    return (
        <>
            <CommandGeneratorCard config={COMMAND_CONFIG.russian} />
            <MinigameCard
                icon={RUSSIAN_ICON}
                title="Ruleta Rusa"
                description="Juego de azar extremo. ¿Te atreves?"
                staggered
                centerBody
            >
                <div className="relative z-[1] my-5 flex justify-center px-5 py-5">
                    {gunDead ? (
                        <Skull
                            className={`size-20 shrink-0 transition-all max-[600px]:size-16 text-error ${loading ? 'animate-[gunShake_0.5s_cubic-bezier(0.36,0.07,0.19,0.97)_both] text-primary' : gunSuccess ? 'text-success' : ''}`}
                            strokeWidth={1.75}
                            aria-hidden
                        />
                    ) : (
                        <RUSSIAN_ICON
                            className={`size-20 shrink-0 transition-all max-[600px]:size-16 ${loading ? 'animate-[gunShake_0.5s_cubic-bezier(0.36,0.07,0.19,0.97)_both] text-primary' : gunSuccess ? 'text-success' : 'text-[#71717a] hover:scale-110 hover:rotate-[-5deg]'}`}
                            strokeWidth={1.75}
                            aria-hidden
                        />
                    )}
                </div>

                <div className="relative before:absolute before:top-[-10px] before:left-1/2 before:h-0.5 before:w-[200px] before:-translate-x-1/2 before:bg-gradient-to-r before:from-transparent before:via-primary/30 before:to-transparent max-[600px]:before:w-[100px]">
                    <button
                        type="button"
                        onClick={() => void pullTrigger()}
                        disabled={loading}
                        className="relative inline-flex items-center gap-2 overflow-hidden rounded-xl border-2 border-white/10 bg-error-dark px-10 py-3.5 text-[1rem] font-semibold text-white transition hover:-translate-y-0.5 hover:scale-105 hover:bg-error active:translate-y-px active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 max-[600px]:w-full max-[600px]:justify-center max-[600px]:px-6 max-[600px]:py-3 max-[600px]:text-[0.9375rem]"
                    >
                        {loading ? <Loader2 className="size-4 animate-spin" /> : <RUSSIAN_ICON className="size-4" strokeWidth={2} />}
                        Jalar Gatillo
                    </button>
                </div>

                <GameResponse
                    result={result}
                    successIcon={Check}
                    errorIcon={Skull}
                    loadingNode={
                        <>
                            <Loader2 className="animate-spin text-lg" />
                            <span>Girando el cilindro...</span>
                        </>
                    }
                />
            </MinigameCard>
        </>
    );
}

