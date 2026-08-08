import { Loader2, Skull, Check } from 'lucide-react';
import { useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import { authHeaders, withApiCredentials } from '@/core/api/auth';
import { fetchWithRetry } from '@/core/api/fetchWithRetry';
import { useRequiredSession } from '@/core/session/useSession';
import { COMMAND_CONFIG } from '@/features/commands/lib/config';
import { CommandGeneratorCard } from '@/features/commands/CommandGeneratorCard';
import { RUSSIAN_ICON } from '@/features/dashboard/lib/dashboardTabs';
import { useTranslation } from '@/core/i18n/I18nContext';
import { MinigameCard } from '../MinigameCard';
import { GameResponse, parseApiError, type TestResult } from '../lib/minigameUtils';

export function RussianView() {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const mgT = t.minigames.russian;
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
                setResult({ status: 'error', message: err ? parseApiError(err) : mgT.errorUnknown });
            }
        } catch {
            setResult({ status: 'error', message: mgT.errorJammed });
        }
    };

    return (
        <>
            <CommandGeneratorCard config={COMMAND_CONFIG.russian} />
            <MinigameCard
                icon={RUSSIAN_ICON}
                title={mgT.testTitle}
                description={mgT.testDesc}
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
                            className={`size-20 shrink-0 transition-all max-[600px]:size-16 ${loading ? 'animate-[gunShake_0.5s_cubic-bezier(0.36,0.07,0.19,0.97)_both] text-primary' : gunSuccess ? 'text-success' : 'text-text-muted hover:scale-110 hover:rotate-[-5deg]'}`}
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
                        className="relative inline-flex items-center gap-2 overflow-hidden rounded-xl border-2 border-border-subtle bg-error-dark px-10 py-3.5 text-[1rem] font-semibold text-white transition hover:-translate-y-0.5 hover:scale-105 hover:bg-error active:translate-y-px active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 max-[600px]:w-full max-[600px]:justify-center max-[600px]:px-6 max-[600px]:py-3 max-[600px]:text-[0.9375rem]"
                    >
                        {loading ? <Loader2 className="size-4 animate-spin" /> : <RUSSIAN_ICON className="size-4" strokeWidth={2} />}
                        {mgT.btnTrigger}
                    </button>
                </div>

                <GameResponse
                    result={result}
                    successIcon={Check}
                    errorIcon={Skull}
                    loadingNode={
                        <>
                            <Loader2 className="animate-spin text-lg" />
                            <span>{mgT.loadingResult}</span>
                        </>
                    }
                />
            </MinigameCard>
        </>
    );
}
