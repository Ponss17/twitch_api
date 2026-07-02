import { TabSyncService } from '@/features/dashboard/lib/tabSyncService';

/**
 * Fake BroadcastChannel que enruta mensajes entre instancias del mismo canal,
 * replicando la semántica real: el emisor NO recibe sus propios mensajes.
 */
class FakeBroadcastChannel {
    static channels = new Map<string, Set<FakeBroadcastChannel>>();
    onmessage: ((ev: { data: unknown }) => void) | null = null;
    private closed = false;

    constructor(public name: string) {
        if (!FakeBroadcastChannel.channels.has(name)) {
            FakeBroadcastChannel.channels.set(name, new Set());
        }
        FakeBroadcastChannel.channels.get(name)!.add(this);
    }

    postMessage(data: unknown) {
        const peers = FakeBroadcastChannel.channels.get(this.name);
        if (!peers) return;
        for (const peer of peers) {
            if (peer === this || peer.closed) continue;
            peer.onmessage?.({ data });
        }
    }

    close() {
        this.closed = true;
        FakeBroadcastChannel.channels.get(this.name)?.delete(this);
    }

    static reset() {
        FakeBroadcastChannel.channels.clear();
    }
}

const CHANNEL = 'test-sync';
let services: TabSyncService[] = [];

function makeService(): TabSyncService {
    const svc = new TabSyncService(CHANNEL);
    services.push(svc);
    return svc;
}

function countLeaders(): number {
    return services.filter((s) => s.getIsLeader()).length;
}

describe('TabSyncService (sincronización líder/seguidor)', () => {
    beforeAll(() => {
        if (!globalThis.crypto?.randomUUID) {
            // jsdom puede no exponer randomUUID; el id real solo necesita ser único.
            let counter = 0;
            (globalThis as unknown as { crypto: Crypto }).crypto = {
                ...globalThis.crypto,
                randomUUID: () => `00000000-0000-0000-0000-${String(counter++).padStart(12, '0')}`
            } as Crypto;
        }
    });

    beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        FakeBroadcastChannel.reset();
        (globalThis as unknown as { BroadcastChannel: typeof BroadcastChannel }).BroadcastChannel =
            FakeBroadcastChannel as unknown as typeof BroadcastChannel;
        services = [];
    });

    afterEach(() => {
        services.forEach((s) => s.isActive() && s.destroy());
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('una única pestaña asume el liderazgo tras la ventana de elección', () => {
        const a = makeService();
        expect(a.getIsLeader()).toBe(false);

        jest.advanceTimersByTime(1500);

        expect(a.getIsLeader()).toBe(true);
    });

    it('notifica LEADER_CHANGED al asumir el liderazgo', () => {
        const a = makeService();
        const onLeader = jest.fn();
        a.on('LEADER_CHANGED', onLeader);

        jest.advanceTimersByTime(1500);

        expect(onLeader).toHaveBeenCalledWith({ isLeader: true });
    });

    it('una segunda pestaña permanece como follower mientras hay un líder activo', () => {
        const a = makeService();
        jest.advanceTimersByTime(1500);
        expect(a.getIsLeader()).toBe(true);

        const b = makeService();
        jest.advanceTimersByTime(1500);

        expect(b.getIsLeader()).toBe(false);
        expect(a.getIsLeader()).toBe(true);
    });

    it('garantiza un único líder aunque varias pestañas arranquen a la vez', () => {
        makeService();
        makeService();
        makeService();

        jest.advanceTimersByTime(1500);

        expect(countLeaders()).toBe(1);
    });

    it('promueve a un follower cuando el líder desaparece (failover)', () => {
        const a = makeService();
        jest.advanceTimersByTime(1500);
        const b = makeService();
        jest.advanceTimersByTime(1500);
        expect(a.getIsLeader()).toBe(true);
        expect(b.getIsLeader()).toBe(false);

        a.destroy();
        // Sin heartbeats del líder, b detecta el timeout y convoca nueva elección.
        jest.advanceTimersByTime(12000);

        expect(b.getIsLeader()).toBe(true);
    });

    it('entrega mensajes broadcast a las demás pestañas pero no al emisor', () => {
        const a = makeService();
        const b = makeService();
        const onA = jest.fn();
        const onB = jest.fn();
        a.on('PING', onA);
        b.on('PING', onB);

        b.broadcast('PING', { value: 42 });

        expect(onA).toHaveBeenCalledWith({ value: 42 });
        expect(onB).not.toHaveBeenCalled();
    });

    it('queda inactivo y deja de emitir tras destroy()', () => {
        const a = makeService();
        const b = makeService();
        const onB = jest.fn();
        b.on('PING', onB);

        a.destroy();
        expect(a.isActive()).toBe(false);

        a.broadcast('PING', { value: 1 });
        expect(onB).not.toHaveBeenCalled();
    });
});
