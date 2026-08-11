import { Loader2, Swords, Gavel } from 'lucide-react';
import { useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import { authHeaders, withApiCredentials } from '@/core/api/auth';
import { fetchWithRetry } from '@/core/api/fetchWithRetry';
import { useRequiredSession } from '@/core/session/useSession';
import { COMMAND_CONFIG } from '@/features/commands/lib/config';
import { btnPrimary, fadeIn, formGrid, formGroupLabel, textInput } from '@/core/utils/tw';
import { CommandGeneratorCard } from '@/features/commands/CommandGeneratorCard';
import { useTranslation } from '@/core/i18n/I18nContext';
import { MinigameCard } from '../MinigameCard';
import {
    createMinigameParams,
    GameResponse,
    parseApiError,
    normalizeTwitchLogin,
    TWITCH_LOGIN,
    type TestResult
} from '../lib/minigameUtils';

export function DuelView() {
    const session = useRequiredSession();
    const { t, locale } = useTranslation();
    const mgT = t.minigames.duel;
    const [target, setTarget] = useState('');
    const [challenger, setChallenger] = useState('');
    const [result, setResult] = useState<TestResult>({ status: 'idle', message: '' });

    const fight = async () => {
        const targetLogin = normalizeTwitchLogin(target);
        const challengerLogin = normalizeTwitchLogin(challenger);

        if (!targetLogin) {
            setResult({ status: 'error', message: mgT.errorEmptyTarget });
            return;
        }

        if (!TWITCH_LOGIN.test(targetLogin) || (challengerLogin && !TWITCH_LOGIN.test(challengerLogin))) {
            setResult({ status: 'error', message: mgT.errorInvalidLogin });
            return;
        }

        setResult({ status: 'loading', message: '' });

        try {
            const params = createMinigameParams(locale, { target: targetLogin });
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
        <div className={fadeIn}>
            <CommandGeneratorCard config={COMMAND_CONFIG.duel} />
            <MinigameCard
                icon={Swords}
                title={mgT.testTitle}
                description={mgT.testDesc}
                info={mgT.testInfo}
                staggered
            >
                <div className={formGrid}>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="duel-target" className={formGroupLabel}>
                            {mgT.targetLabel}
                        </label>
                        <input
                            id="duel-target"
                            type="text"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && void fight()}
                            placeholder={mgT.targetPlaceholder}
                            className={textInput}
                            disabled={result.status === 'loading'}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="duel-challenger" className={formGroupLabel}>
                            {mgT.challengerLabel}
                        </label>
                        <input
                            id="duel-challenger"
                            type="text"
                            value={challenger}
                            onChange={(e) => setChallenger(e.target.value)}
                            placeholder={mgT.challengerPlaceholder}
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
                    {result.status === 'loading' ? mgT.btnLoading : mgT.btnFight}
                </button>
                <GameResponse
                    result={result}
                    loadingNode={
                        <div className="flex items-center gap-3 font-medium text-[#f97316] italic">
                            <Swords className="animate-[gunShake_1s_infinite_linear] text-[1.8rem]" />
                            {mgT.loadingResult}
                        </div>
                    }
                />
            </MinigameCard>
        </div>
    );
}
