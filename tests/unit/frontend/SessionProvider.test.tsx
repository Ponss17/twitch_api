import { act, render, screen, waitFor } from '@testing-library/react';
import { SessionProvider } from '@/shared/providers/SessionProvider';
import { useSession } from '@/core/session/useSession';

jest.mock('@/core/api/auth', () => ({
    initAuthSync: jest.fn(),
    resolveSessionFromUrl: jest.fn(),
    mergeSessionFromValidate: jest.fn((session, result) => ({
        ...session,
        apiKey: typeof result.apiKey === 'string' ? result.apiKey : session.apiKey,
        login:
            result.user && typeof result.user === 'object' && 'login' in result.user
                ? String((result.user as { login: string }).login)
                : session.login
    })),
    getSession: jest.fn(),
    readOptimisticAuthState: jest.fn(() => ({
        session: null,
        loading: true,
        authenticated: false
    })),
    resolveDegradedSession: jest.fn((session) => session),
    stripSensitiveQueryParams: jest.fn(),
    validateSession: jest.fn(),
    clearSession: jest.fn()
}));

const showToastMock = jest.fn();

jest.mock('@/shared/ui/ToastProvider', () => ({
    useToastOptional: () => showToastMock
}));

import { resolveSessionFromUrl, mergeSessionFromValidate, validateSession, getSession, readOptimisticAuthState } from '@/core/api/auth';

const mockedResolveSessionFromUrl = resolveSessionFromUrl as jest.Mock;
const mockedValidateSession = validateSession as jest.Mock;
const mockedMergeSessionFromValidate = mergeSessionFromValidate as jest.Mock;

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
        (readOptimisticAuthState as jest.Mock).mockReturnValue({
            session: null,
            loading: true,
            authenticated: false
        });
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
        expect(mockedMergeSessionFromValidate).toHaveBeenCalled();
    });

    it('shows stored session immediately while validation runs', async () => {
        const stored = { apiKey: 'k', login: 'streamer', displayName: 'Streamer' };
        (getSession as jest.Mock).mockReturnValue(stored);
        (readOptimisticAuthState as jest.Mock).mockReturnValue({
            session: stored,
            loading: false,
            authenticated: true
        });

        let resolveValidate: (value: unknown) => void = () => {};
        mockedResolveSessionFromUrl.mockResolvedValue({ apiKey: 'k', login: 'streamer' });
        mockedValidateSession.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveValidate = resolve;
                })
        );

        render(
            <SessionProvider>
                <SessionProbe />
            </SessionProvider>
        );

        expect(screen.getByText('user:streamer')).toBeInTheDocument();

        await waitFor(() => expect(mockedValidateSession).toHaveBeenCalled());
        await act(async () => {
            resolveValidate({
                valid: true,
                apiKey: 'k',
                user: { login: 'streamer', display_name: 'Streamer', id: '1' }
            });
        });
        await waitFor(() => expect(screen.getByText('user:streamer')).toBeInTheDocument());
    });

    it('shows anonymous state when validation fails', async () => {
        (readOptimisticAuthState as jest.Mock).mockReturnValue({
            session: null,
            loading: true,
            authenticated: false
        });
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
