import { Loader2, Gem, Play } from 'lucide-react';
import { useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import { authHeaders, withApiCredentials } from '@/core/api/auth';
import { fetchWithRetry } from '@/core/api/fetchWithRetry';
import { useRequiredSession } from '@/core/session/useSession';
import { COMMAND_CONFIG } from '@/features/commands/lib/config';
import { btnPrimary, fadeIn, formGrid, formGroupLabel, textInput } from '@/core/utils/tw';
import { CommandGeneratorCard } from '@/features/commands/CommandGeneratorCard';
import { MAGIC8_ICON } from '@/features/dashboard/lib/dashboardTabs';
import { useTranslation } from '@/core/i18n/I18nContext';
import { MinigameCard } from '../MinigameCard';
import { GameResponse, parseApiError, type TestResult } from '../lib/minigameUtils';

export function Magic8View() {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const mgT = t.minigames.magic8;
    const [question, setQuestion] = useState('');
    const [commandExtras, setCommandExtras] = useState<Record<string, string>>({});
    const [result, setResult] = useState<TestResult>({ status: 'idle', message: '' });

    const ask = async () => {
        if (!question.trim()) {
            setResult({ status: 'error', message: mgT.errorEmpty });
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
        <div className={fadeIn}>
            <CommandGeneratorCard
                config={COMMAND_CONFIG.magic8}
                onExtraValuesChange={setCommandExtras}
            />
            <MinigameCard
                icon={MAGIC8_ICON}
                title={mgT.testTitle}
                description={mgT.testDesc}
                info={mgT.testInfo}
                staggered
            >
                <div className={formGrid}>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="magic8-question" className={formGroupLabel}>
                            {mgT.questionLabel}
                        </label>
                        <input
                            id="magic8-question"
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && void ask()}
                            placeholder={mgT.questionPlaceholder}
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
                    {result.status === 'loading' ? mgT.btnLoading : mgT.btnAsk}
                </button>
                <GameResponse
                    result={result}
                    loadingNode={
                        <div className="flex items-center gap-3 font-medium text-brand-text italic">
                            <Gem className="animate-pulse text-[1.8rem]" />
                            {mgT.loadingResult}
                        </div>
                    }
                />
            </MinigameCard>
        </div>
    );
}
