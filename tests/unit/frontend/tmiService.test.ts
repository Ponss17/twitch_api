const clients: FakeClient[] = [];

class FakeClient {
    static pending: Array<() => void> = [];
    readonly options: { channels?: string[]; identity?: { username: string } };
    readonly disconnect = jest.fn().mockResolvedValue(undefined);
    readonly say = jest.fn().mockResolvedValue(undefined);
    private handlers = new Map<string, (...args: never[]) => void>();

    constructor(options: FakeClient['options']) {
        this.options = options;
        clients.push(this);
    }

    connect(): Promise<void> {
        return new Promise((resolve) => FakeClient.pending.push(resolve));
    }

    on(event: string, handler: (...args: never[]) => void): void {
        this.handlers.set(event, handler);
    }
}

jest.mock('tmi.js', () => ({ Client: FakeClient }));

import { TmiChatService } from '@/features/chat/lib/tmiService';

async function waitForPendingConnection(): Promise<void> {
    for (let attempt = 0; attempt < 20 && FakeClient.pending.length === 0; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
    expect(FakeClient.pending.length).toBeGreaterThan(0);
}

describe('TmiChatService lifecycle', () => {
    beforeEach(() => {
        clients.length = 0;
        FakeClient.pending.length = 0;
    });

    it('no reutiliza cliente si cambia canal o identidad', async () => {
        const service = new TmiChatService();
        const first = service.connect('canal-a', { username: 'one', token: 'a' });
        await waitForPendingConnection();
        FakeClient.pending.shift()?.();
        await first;

        const second = service.connect('canal-b', { username: 'two', token: 'b' });
        await waitForPendingConnection();

        expect(clients).toHaveLength(2);
        expect(clients[0]!.disconnect).toHaveBeenCalled();
        expect(clients[1]!.options.channels).toEqual(['canal-b']);
        expect(clients[1]!.options.identity?.username).toBe('two');

        FakeClient.pending.shift()?.();
        await second;
        expect(service.isConnected).toBe(true);
    });

    it('ignora la conexión obsoleta tras disconnect/connect rápido', async () => {
        const service = new TmiChatService();
        const stale = service.connect('old');
        await waitForPendingConnection();
        service.disconnect();

        const current = service.connect('new');
        await waitForPendingConnection();
        expect(clients).toHaveLength(2);

        FakeClient.pending.shift()?.();
        await stale;
        expect(service.isConnected).toBe(false);

        FakeClient.pending.shift()?.();
        await current;
        expect(service.isConnected).toBe(true);
        expect(clients[0]!.disconnect).toHaveBeenCalled();
    });
});
