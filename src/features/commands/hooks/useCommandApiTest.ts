import { useRef, useState } from 'react';
import { useTranslation } from '@/core/i18n/I18nContext';
import { fetchRevealApiKey } from '@/core/api/auth';
import { buildAuthQueryParam } from '@/core/api/authQuery';
import { fetchWithRetry } from '@/core/api/fetchWithRetry';
import type { CommandTestResult } from '@/features/commands/lib/commandStore';

type UseCommandApiTestOptions = {
    buildUrl: (apiKey: string) => string;
    validateResponse?: (text: string, responseOk: boolean) => boolean;
};

function docsHintForStatus(status: number): CommandTestResult['docsHint'] {
    if (status === 429) return 'limits';
    if (status === 401 || status === 403) return 'errors';
    return null;
}

export function useCommandApiTest(setStoredResult: (result: CommandTestResult) => void) {
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
            const docsHint = docsHintForStatus(response.status);
            if (!text) {
                setStoredResult({
                    status: 'error',
                    message: response.ok
                        ? t.commands.generator.toasts.noCommand
                        : t.commands.apiTest.httpError(response.status),
                    docsHint
                });
                return;
            }

            const isValid = options.validateResponse
                ? options.validateResponse(text, response.ok)
                : response.ok;

            setStoredResult({
                status: isValid ? 'success' : 'error',
                message: text,
                docsHint: isValid ? null : docsHint
            });
        } catch {
            if (requestId !== requestIdRef.current) return;
            setStoredResult({
                status: 'error',
                message: t.commands.generator.toasts.apiError,
                docsHint: 'errors'
            });
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
