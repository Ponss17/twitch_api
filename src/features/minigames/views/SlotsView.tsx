import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import { authHeaders, withApiCredentials } from '@/core/api/auth';
import { fetchWithRetry } from '@/core/api/fetchWithRetry';
import { useRequiredSession } from '@/core/session/useSession';
import { COMMAND_CONFIG } from '@/features/commands/lib/config';
import { fadeIn } from '@/core/utils/tw';
import { CommandGeneratorCard } from '@/features/commands/CommandGeneratorCard';
import { SLOTS_ICON } from '@/features/minigames/icons';
import { useTranslation } from '@/core/i18n/I18nContext';
import { MinigameCard } from '../MinigameCard';
import {
    createMinigameParams,
    GameResponse,
    parseApiError,
    type TestResult
} from '../lib/minigameUtils';

const IDLE_REELS: [string, string, string] = ['❓', '❓', '❓'];
const REVEAL_MS = 520;

function parseReelsFromMessage(message: string): [string, string, string] | null {
    const chunk = message.match(/🎰\s*(.+?)(?:\s*[—–-]|$)/)?.[1]?.trim();
    if (!chunk) return null;
    const parts = chunk.split('|').map((p) => p.trim()).filter(Boolean);
    if (parts.length < 3) return null;
    return [parts[0]!, parts[1]!, parts[2]!];
}

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

export function SlotsView() {
    const session = useRequiredSession();
    const { t, locale } = useTranslation();
    const mgT = t.minigames.slots;
    const [result, setResult] = useState<TestResult>({ status: 'idle', message: '' });
    const [reels, setReels] = useState<[string, string, string]>(IDLE_REELS);
    const [revealing, setRevealing] = useState(false);
    const busy = result.status === 'loading' || revealing;

    const spin = async () => {
        setResult({ status: 'loading', message: '' });
        setRevealing(false);
        setReels(IDLE_REELS);

        try {
            const params = createMinigameParams(locale, {
                user: session.login ?? '',
                channel: session.login ?? '',
                _nocache: Date.now().toString()
            });
            const url = `${API_ENDPOINTS.SLOTS}?${params}`;
            const res = await fetchWithRetry(url, withApiCredentials({ headers: authHeaders(session) }));
            const text = await res.text();

            if (!res.ok) {
                setReels(IDLE_REELS);
                setResult({ status: 'error', message: parseApiError(text) });
                return;
            }

            const parsed = parseReelsFromMessage(text);
            if (!parsed) {
                setReels(IDLE_REELS);
                setResult({ status: 'success', message: text });
                return;
            }

            const [a, b, c] = parsed;
            setResult({ status: 'idle', message: '' });
            setRevealing(true);

            setReels([a, '❓', '❓']);
            await wait(REVEAL_MS);
            setReels([a, b, '❓']);
            await wait(REVEAL_MS);
            setReels([a, b, c]);
            await wait(180);

            setRevealing(false);
            setResult({ status: 'success', message: text });
        } catch (e) {
            setRevealing(false);
            setReels(IDLE_REELS);
            setResult({ status: 'error', message: (e as Error).message });
        }
    };

    return (
        <div className={fadeIn}>
            <CommandGeneratorCard config={COMMAND_CONFIG.slots} />
            <MinigameCard
                icon={SLOTS_ICON}
                title={mgT.testTitle}
                description={mgT.testDesc}
                info={mgT.testInfo}
                staggered
                centerBody
            >
                <div className="relative z-[1] my-5 flex justify-center gap-2.5 px-5 py-2 max-[600px]:gap-2">
                    {reels.map((symbol, i) => {
                        const locked = symbol !== '❓';
                        const pulsing = busy && !locked;
                        return (
                            <div
                                key={i}
                                className={`flex h-20 w-[4.5rem] items-center justify-center rounded-xl border text-[2.35rem] leading-none shadow-inner transition-all duration-300 max-[600px]:h-16 max-[600px]:w-14 max-[600px]:text-[1.85rem] ${
                                    locked
                                        ? 'border-primary/35 bg-primary/10 scale-105'
                                        : pulsing
                                          ? 'animate-pulse border-border-strong bg-bg-secondary text-text-muted'
                                          : 'border-border-subtle bg-bg-secondary text-text-muted'
                                }`}
                                aria-hidden
                            >
                                <span>{symbol}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="relative before:absolute before:top-[-10px] before:left-1/2 before:h-0.5 before:w-[200px] before:-translate-x-1/2 before:bg-gradient-to-r before:from-transparent before:via-primary/30 before:to-transparent max-[600px]:before:w-[100px]">
                    <button
                        type="button"
                        onClick={() => void spin()}
                        disabled={busy}
                        className="relative inline-flex items-center gap-2 overflow-hidden rounded-xl border-2 border-border-subtle bg-primary px-10 py-3.5 text-[1rem] font-semibold text-white transition hover:-translate-y-0.5 hover:scale-105 hover:bg-primary-hover active:translate-y-px active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 max-[600px]:w-full max-[600px]:justify-center max-[600px]:px-6 max-[600px]:py-3 max-[600px]:text-[0.9375rem]"
                    >
                        {busy ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <SLOTS_ICON className="size-4" strokeWidth={2} />
                        )}
                        {busy ? mgT.btnLoading : mgT.btnSpin}
                    </button>
                </div>

                <GameResponse
                    result={result}
                    loadingNode={
                        <div className="flex items-center gap-3 font-medium text-primary italic">
                            <SLOTS_ICON className="animate-[gunShake_1s_infinite_linear] text-[1.8rem]" />
                            {mgT.loadingResult}
                        </div>
                    }
                />
            </MinigameCard>
        </div>
    );
}
