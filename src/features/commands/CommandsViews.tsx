import { API_ENDPOINTS } from '@/core/config/config';
import { COMMAND_CONFIG } from '@/features/commands/lib/config';
import { useCommandTestField, useCommandTestResult } from '@/features/commands/hooks/useCommandStore';
import { buildCommandTestUrl, useCommandApiTest } from '@/features/commands/hooks/useCommandApiTest';
import { useRequiredSession } from '@/core/session/useSession';
import { ApiTestCard, CommandGeneratorCard, FormField } from './CommandGeneratorCard';
import { fadeIn } from '@/core/utils/tw';

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
    /no existe en Twitch|no sigue a|No se puede consultar|No se pudo consultar|No se pudo obtener|Debes ser el dueño|moderador|Twitch no está disponible/i;

export function FollowageView() {
    const session = useRequiredSession();
    const ownerChannel = session.login ?? '';
    const [channel, setChannel] = useCommandTestField('followage', 'channel', ownerChannel);
    const [user, setUser] = useCommandTestField('followage', 'user', '');
    const [storedResult, setStoredResult] = useCommandTestResult('followage-test');
    const { loading, runTest } = useCommandApiTest(setStoredResult);

    const handleTest = async (): Promise<void> => {
        const channelVal = (channel.trim() || ownerChannel).toLowerCase();
        const userVal = user.trim();

        if (!channelVal || !userVal) {
            setStoredResult({
                status: 'error',
                message: 'Por favor, ingresa el Canal y el Usuario para probar.'
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
                title="Prueba la API"
                description="Verifica que todo funcione correctamente"
                infoTooltip="Canal = el canal a consultar (el tuyo o uno donde seas mod). Usuario = el follower."
                onTest={handleTest}
                result={toApiTestResult(loading, storedResult)}
            >
                <FormField
                    label="Canal"
                    value={channel || ownerChannel}
                    onChange={setChannel}
                    placeholder={ownerChannel || 'Canal (tuyo o donde seas mod)'}
                />
                <FormField
                    label="Usuario (follower)"
                    value={user}
                    onChange={setUser}
                    placeholder="Ej. snake_1719"
                />
            </ApiTestCard>
        </div>
    );
}

export function ShoutoutView() {
    const session = useRequiredSession();
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
                message: 'Por favor, ingresa el Canal y el Usuario para probar.'
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
                title="Prueba el Shoutout"
                description="Verifica que el shoutout funcione correctamente"
                infoTooltip="Simula una petición manual a la API de shoutout."
                onTest={handleTest}
                result={toApiTestResult(loading, storedResult)}
            >
                <FormField
                    label="Canal"
                    value={channel}
                    onChange={setChannel}
                    placeholder="Tu canal"
                />
                <FormField
                    label="Usuario destino"
                    value={touser}
                    onChange={setTouser}
                    placeholder="A quién dar shoutout"
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
