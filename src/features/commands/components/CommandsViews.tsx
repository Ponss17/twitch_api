import { useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import { buildAuthQueryParam } from '@/core/api/authQuery';
import { COMMAND_CONFIG } from '@/features/commands/lib/config';
import { useCommandTestField, useCommandTestResult } from '@/features/commands/hooks/useCommandStore';
import { useRequiredSession } from '@/core/session/useSession';
import { ApiTestCard, CommandGeneratorCard, FormField } from './CommandGeneratorCard';
import { fadeIn } from '@/core/ui/tw';

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

export function FollowageView() {
    const session = useRequiredSession();
    const [channel, setChannel] = useCommandTestField('followage', 'channel', session.login ?? '');
    const [user, setUser] = useCommandTestField('followage', 'user', '');
    const [storedResult, setStoredResult] = useCommandTestResult('followage-test');
    const [loading, setLoading] = useState(false);

    const runTest = async () => {
        if (!channel.trim() || !user.trim()) {
            setStoredResult({
                status: 'error',
                message: '⚠️ Por favor, ingresa el Canal y el Usuario para probar.'
            });
            return;
        }

        setLoading(true);

        try {
            const { apiKey, token } = session;
            const tokenParam = buildAuthQueryParam({ apiKey, token });
            const buildUrl = () =>
                `${window.location.origin}${API_ENDPOINTS.BASE}/followage?user=${encodeURIComponent(user)}&channel=${encodeURIComponent(channel)}&_nocache=${Date.now()}&${tokenParam}`;

            let response = await fetch(buildUrl());

            // Reintento automático en cold start de Vercel (5xx)
            if (response.status >= 500) {
                await new Promise((r) => setTimeout(r, 900));
                response = await fetch(buildUrl());
            }

            const text = await response.text();
            setStoredResult({
                status: response.ok ? 'success' : 'error',
                message: text
            });
        } catch {
            setStoredResult({ status: 'error', message: 'Error de conexión' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={fadeIn}>
            <CommandGeneratorCard config={COMMAND_CONFIG.follow} />
            <ApiTestCard
                title="Prueba la API"
                description="Verifica que todo funcione correctamente"
                infoTooltip="Simula una petición manual a la API. Útil para verificar si un usuario existe."
                onTest={runTest}
                result={toApiTestResult(loading, storedResult)}
            >
                <FormField value={channel} onChange={setChannel} placeholder="Canal" />
                <FormField value={user} onChange={setUser} placeholder="Usuario" />
            </ApiTestCard>
        </div>
    );
}

export function ShoutoutView() {
    const session = useRequiredSession();
    const [channel, setChannel] = useCommandTestField('shoutout', 'channel', session.login ?? '');
    const [touser, setTouser] = useCommandTestField('shoutout', 'touser', '');
    const [storedResult, setStoredResult] = useCommandTestResult('shoutout-test');
    const [loading, setLoading] = useState(false);

    const runTest = async () => {
        const channelVal = channel.trim() || session.login || '';
        const target = touser.trim();

        if (!target) {
            setStoredResult({
                status: 'error',
                message: '⚠️ Por favor, ingresa el Canal y el Usuario para probar.'
            });
            return;
        }

        setLoading(true);

        try {
            const { apiKey, token } = session;
            const tokenParam = buildAuthQueryParam({ apiKey, token });
            const buildUrl = () =>
                `${window.location.origin}${API_ENDPOINTS.BASE}/shoutout?channel=${encodeURIComponent(channelVal)}&touser=${encodeURIComponent(target)}&_nocache=${Date.now()}&${tokenParam}`;

            let response = await fetch(buildUrl());

            // Reintento automático en cold start de Vercel (5xx)
            if (response.status >= 500) {
                await new Promise((r) => setTimeout(r, 900));
                response = await fetch(buildUrl());
            }

            const text = await response.text();
            setStoredResult({
                status: response.ok ? 'success' : 'error',
                message: text
            });
        } catch {
            setStoredResult({ status: 'error', message: 'Error de conexión' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={fadeIn}>
            <CommandGeneratorCard config={COMMAND_CONFIG.shoutout} />
            <ApiTestCard
                title="Prueba el Shoutout"
                description="Previsualiza el mensaje antes de usarlo en directo"
                infoTooltip="Llama directamente a la API con el canal destino y muestra el mensaje de shoutout real, incluido el juego actual."
                onTest={runTest}
                result={toApiTestResult(loading, storedResult)}
                buttonLabel="Probar Shoutout"
            >
                <FormField value={channel} onChange={setChannel} placeholder="Tu canal" />
                <FormField value={touser} onChange={setTouser} placeholder="Canal a shoutoutear" />
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
