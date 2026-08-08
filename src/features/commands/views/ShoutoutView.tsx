import { API_ENDPOINTS } from '@/core/config/config';
import { COMMAND_CONFIG } from '@/features/commands/lib/config';
import { useCommandTestField, useCommandTestResult } from '@/features/commands/hooks/useCommandStore';
import { buildCommandTestUrl, useCommandApiTest } from '@/features/commands/hooks/useCommandApiTest';
import { useRequiredSession } from '@/core/session/useSession';
import { ApiTestCard, CommandGeneratorCard, FormField } from '../CommandGeneratorCard';
import { fadeIn } from '@/core/utils/tw';
import { useTranslation } from '@/core/i18n/I18nContext';
import { toApiTestResult } from '../lib/viewUtils';

export function ShoutoutView() {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const viewT = t.commands.views;
    const [channel, setChannel] = useCommandTestField('shoutout', 'channel', session.login ?? '');
    const [touser, setTouser] = useCommandTestField('shoutout', 'touser', '');
    const [storedResult, setStoredResult] = useCommandTestResult('shoutout-test');
    const { loading, runTest } = useCommandApiTest(setStoredResult);

    const handleTest = async (): Promise<void> => {
        const channelVal = channel.trim() || session.login || '';
        const target = touser.trim();

        if (!target) {
            setStoredResult({ status: 'error', message: viewT.errors.missingFields });
            return;
        }

        await runTest({
            buildUrl: (apiKey) =>
                buildCommandTestUrl(
                    `${API_ENDPOINTS.BASE}/shoutout/`,
                    { channel: channelVal, touser: target },
                    apiKey
                )
        });
    };

    return (
        <div className={fadeIn}>
            <CommandGeneratorCard config={COMMAND_CONFIG.shoutout} />
            <ApiTestCard
                title={viewT.shoutout.testTitle}
                description={viewT.shoutout.testDesc}
                infoTooltip={viewT.shoutout.testTooltip}
                onTest={handleTest}
                result={toApiTestResult(loading, storedResult)}
            >
                <FormField
                    label={viewT.shoutout.channelLabel}
                    value={channel}
                    onChange={setChannel}
                    placeholder={viewT.shoutout.channelPlaceholder}
                />
                <FormField
                    label={viewT.shoutout.userLabel}
                    value={touser}
                    onChange={setTouser}
                    placeholder={viewT.shoutout.userPlaceholder}
                />
            </ApiTestCard>
        </div>
    );
}
