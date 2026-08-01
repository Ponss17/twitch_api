import { useRef, useState } from 'react';
import { useTranslation } from '@/core/i18n/I18nContext';
import { fetchRevealApiKey } from '@/core/api/auth';
import { buildAuthQueryParam } from '@/core/api/authQuery';
import { fetchWithRetry } from '@/core/api/fetchWithRetry';

export type CommandTestResult = {
    status: 'success' | 'error' | null;
    message: string;
};

type UseCommandApiTestOptions = {
    buildUrl: (apiKey: string) => string;
    validateResponse?: (text: string, responseOk: boolean) => boolean;
};

export function useCommandApiTest(
    setStoredResult: (result: CommandTestResult) => void
) {
    const [loading, setLoading] = useState(false);
    const requestIdRef = useRef(0);
    const { t } = useTranslation();

    const runTest = async (options: UseCommandApiTestOptions): Promise<void> => {
        const requestId = ++requestIdRef.current;
        setLoading(true);

        try {
            const { apiKey } = await fetchRevealApiKey();
            const response = await fetchWithRetry(options.buildUrl(apiKey));
            if (requestId !== requestIdRef.current) return;

            const text = (await response.text()).trim();
            if (!text) {
                setStoredResult({
                    status: 'error',
                    message: response.ok
                        ? t.commands.generator.toasts.noCommand
                        : `Error HTTP ${response.status}.`
                });
                return;
            }

            const isValid = options.validateResponse
                ? options.validateResponse(text, response.ok)
                : response.ok;

            setStoredResult({
                status: isValid ? 'success' : 'error',
                message: text
            });
        } catch {
            if (requestId !== requestIdRef.current) return;
            setStoredResult({ status: 'error', message: t.commands.generator.toasts.apiError });
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    };

    return { loading, runTest };
}

export function buildCommandTestUrl(path: string, params: Record<string, string>, apiKey: string): string {
    const tokenParam = buildAuthQueryParam({ apiKey });
    const query = new URLSearchParams({ ...params, _nocache: String(Date.now()) });
    return `${window.location.origin}${path}?${query}&${tokenParam}`;
}
