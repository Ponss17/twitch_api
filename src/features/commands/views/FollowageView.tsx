import { API_ENDPOINTS } from '@/core/config/config';
import { COMMAND_CONFIG } from '@/features/commands/lib/config';
import { useCommandTestField, useCommandTestResult } from '@/features/commands/hooks/useCommandStore';
import { buildCommandTestUrl, useCommandApiTest } from '@/features/commands/hooks/useCommandApiTest';
import { useRequiredSession } from '@/core/session/useSession';
import { ApiTestCard, CommandGeneratorCard, FormField } from '../CommandGeneratorCard';
import { fadeIn } from '@/core/utils/tw';
import { useTranslation } from '@/core/i18n/I18nContext';
import { toApiTestResult, followageErrorPattern } from '../lib/viewUtils';

export function FollowageView() {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const viewT = t.commands.views;
    const ownerChannel = session.login ?? '';
    const [channel, setChannel] = useCommandTestField('followage', 'channel', ownerChannel);
    const [user, setUser] = useCommandTestField('followage', 'user', '');
    const [storedResult, setStoredResult] = useCommandTestResult('followage-test');
    const { loading, runTest } = useCommandApiTest(setStoredResult);

    const handleTest = async (): Promise<void> => {
        const channelVal = channel.trim().toLowerCase();
        const userVal = user.trim();

        if (!channelVal || !userVal) {
            setStoredResult({ status: 'error', message: viewT.errors.missingFields });
            return;
        }

        await runTest({
            buildUrl: (apiKey) =>
                buildCommandTestUrl(
                    `${API_ENDPOINTS.FOLLOWAGE}`,
                    { user: userVal, channel: channelVal },
                    apiKey
                ),
            validateResponse: (text, responseOk) =>
                responseOk && text.trim().length > 0 && !followageErrorPattern.test(text)
        });
    };

    return (
        <div className={fadeIn}>
            <CommandGeneratorCard config={COMMAND_CONFIG.follow} />
            <ApiTestCard
                title={viewT.followage.testTitle}
                description={viewT.followage.testDesc}
                infoTooltip={viewT.followage.testTooltip}
                onTest={handleTest}
                result={toApiTestResult(loading, storedResult)}
            >
                <FormField
                    label={viewT.followage.channelLabel}
                    value={channel}
                    onChange={setChannel}
                    placeholder={ownerChannel || viewT.followage.channelPlaceholder}
                />
                <FormField
                    label={viewT.followage.userLabel}
                    value={user}
                    onChange={setUser}
                    placeholder={viewT.followage.userPlaceholder}
                />
            </ApiTestCard>
        </div>
    );
}
