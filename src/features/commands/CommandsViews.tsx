import { API_ENDPOINTS } from '@/core/config/config';
import { COMMAND_CONFIG } from '@/features/commands/lib/config';
import { useCommandTestField, useCommandTestResult } from '@/features/commands/hooks/useCommandStore';
import { buildCommandTestUrl, useCommandApiTest } from '@/features/commands/hooks/useCommandApiTest';
import { useRequiredSession } from '@/core/session/useSession';
import { ApiTestCard, CommandGeneratorCard, FormField } from './CommandGeneratorCard';
import { fadeIn } from '@/core/utils/tw';
import { useTranslation } from '@/core/i18n/I18nContext';

function toApiTestResult(
    loading: boolean,
    stored: { status: 'success' | 'error' | null; message: string }
) {
    if (loading) return { status: 'loading' as const, message: '' };
    if (stored.status === 'success' || stored.status === 'error') {
        return { status: stored.status, message: stored.message };
    }
    return { status: 'idle' as const, message: '' };
}

const followageErrorPattern =
    /no existe en Twitch|No se puede consultar|No se pudo consultar|No se pudo obtener|Debes ser el dueño|moderador|actualizar permisos|moderator:read:followers|Twitch no está disponible|does not exist|cannot fetch|could not fetch|must be owner|update permissions|Twitch is unavailable/i;

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
            setStoredResult({
                status: 'error',
                message: viewT.errors.missingFields
            });
            return;
        }

        await runTest({
            buildUrl: (apiKey) =>
                buildCommandTestUrl(
                    `${API_ENDPOINTS.BASE}/followage/`,
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
            setStoredResult({
                status: 'error',
                message: viewT.errors.missingFields
            });
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

export function ClipCommandView() {
    return (
        <div className={fadeIn}>
            <CommandGeneratorCard config={COMMAND_CONFIG.clip} />
        </div>
    );
}
