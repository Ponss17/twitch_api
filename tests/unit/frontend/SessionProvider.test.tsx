import { render, screen, waitFor } from '@testing-library/react';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { useSession } from '@/hooks/useSession';

jest.mock('@/lib/auth', () => ({
    initAuthSync: jest.fn(),
    resolveSessionFromUrl: jest.fn(),
    saveSession: jest.fn(),
    validateSession: jest.fn(),
    clearSession: jest.fn()
}));

const showToastMock = jest.fn();

jest.mock('@/components/ui/ToastProvider', () => ({
    useToastOptional: () => showToastMock
}));

import { resolveSessionFromUrl, saveSession, validateSession } from '@/lib/auth';

const mockedResolveSessionFromUrl = resolveSessionFromUrl as jest.Mock;
const mockedValidateSession = validateSession as jest.Mock;
const mockedSaveSession = saveSession as jest.Mock;

function SessionProbe() {
    const { session, loading, authenticated } = useSession();

    if (loading) return <div>loading</div>;
    if (!authenticated || !session) return <div>anonymous</div>;
    return <div>user:{session.login}</div>;
}

describe('SessionProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('resolves session from url before validating', async () => {
        const order: string[] = [];
        mockedResolveSessionFromUrl.mockImplementation(async () => {
            order.push('resolveSessionFromUrl');
            return { apiKey: 'k', login: 'streamer' };
        });
        mockedValidateSession.mockImplementation(async () => {
            order.push('validate');
            return {
                valid: true,
                apiKey: 'k',
                user: { login: 'streamer', display_name: 'Streamer', id: '1' }
            };
        });

        render(
            <SessionProvider>
                <SessionProbe />
            </SessionProvider>
        );

        await waitFor(() => expect(screen.getByText('user:streamer')).toBeInTheDocument());
        expect(order.indexOf('resolveSessionFromUrl')).toBeLessThan(order.indexOf('validate'));
        expect(mockedSaveSession).toHaveBeenCalled();
    });

    it('shows anonymous state when validation fails', async () => {
        mockedResolveSessionFromUrl.mockResolvedValue({ apiKey: 'bad' });
        mockedValidateSession.mockResolvedValue({ valid: false, error: true });

        render(
            <SessionProvider>
                <SessionProbe />
            </SessionProvider>
        );

        await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument());
    });

    it('keeps session when validation succeeds with a network warning', async () => {
        mockedResolveSessionFromUrl.mockResolvedValue({ apiKey: 'k', login: 'streamer' });
        mockedValidateSession.mockResolvedValue({ valid: true, error: true, message: 'network_error' });

        render(
            <SessionProvider>
                <SessionProbe />
            </SessionProvider>
        );

        await waitFor(() => expect(screen.getByText('user:streamer')).toBeInTheDocument());
        expect(showToastMock).toHaveBeenCalledWith('Conexión inestable con el servidor', 'warning');
    });

    it('refresh updates session after validate returns a new api key', async () => {
        mockedResolveSessionFromUrl.mockResolvedValue({ apiKey: 'k', login: 'streamer' });
        mockedValidateSession
            .mockResolvedValueOnce({
                valid: true,
                apiKey: 'k',
                user: { login: 'streamer', display_name: 'Streamer', id: '1' }
            })
            .mockResolvedValue({
                valid: true,
                apiKey: 'rotated',
                user: { login: 'streamer', display_name: 'Streamer', id: '1' }
            });

        function RefreshProbe() {
            const { session, loading, refresh } = useSession();
            if (loading) return <div>loading</div>;
            return (
                <div>
                    <span data-testid="api-key">{session?.apiKey ?? 'none'}</span>
                    <button type="button" onClick={() => void refresh()}>
                        refresh
                    </button>
                </div>
            );
        }

        render(
            <SessionProvider>
                <RefreshProbe />
            </SessionProvider>
        );

        await waitFor(() => expect(screen.getByTestId('api-key')).toHaveTextContent('k'));
        screen.getByRole('button', { name: 'refresh' }).click();
        await waitFor(() => expect(screen.getByTestId('api-key')).toHaveTextContent('rotated'));
    });
});
