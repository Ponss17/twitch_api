import { logError } from '@/core/logging/logError';
import { debugLog } from '@/core/logging/debugLog';

export type SyncMessage = {
    type: string;
    payload?: unknown;
    leaderId?: string;
};

export class TabSyncService {
    private channel: BroadcastChannel;
    private destroyed = false;
    private isLeader = false;
    private tabId = crypto.randomUUID();
    private electionTimeout: number | null = null;
    private monitorInterval: number | null = null;
    private heartbeatInterval: number | null = null;
    private beforeUnloadHandler: (() => void) | null = null;
    private listeners: Map<string, ((payload: unknown) => void)[]> = new Map();

    private readonly ELECTION_WAIT_MS = 1500;
    private readonly HEARTBEAT_MS = 3000;
    private readonly LEADER_TIMEOUT_MS = 6000;

    private lastLeaderHeartbeat = 0;

    isActive(): boolean {
        return !this.destroyed;
    }

    private safePostMessage(msg: SyncMessage): boolean {
        if (this.destroyed) return false;
        try {
            this.channel.postMessage(msg);
            return true;
        } catch (error) {
            logError('TabSync', error, `Error al emitir mensaje (${msg.type})`);
            return false;
        }
    }

    constructor(channelName: string) {
        this.channel = new BroadcastChannel(channelName);
        this.setupListeners();
        this.startElectionProcess();
    }

    private setupListeners() {
        this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
            const msg = event.data;

            if (msg.type === 'HEARTBEAT') {
                this.lastLeaderHeartbeat = Date.now();
                if (this.isLeader && msg.leaderId !== this.tabId) {
                    if (this.tabId > (msg.leaderId || '')) {
                        this.isLeader = false;
                        this.stopHeartbeat();
                        debugLog('[TabSync] Cediendo liderazgo a otra pestaña.');
                    }
                }
            } else if (msg.type === 'ELECTION') {
                if (this.isLeader) {
                    this.sendHeartbeat();
                }
            } else {
                this.triggerListeners(msg.type, msg.payload);
            }
        };

        this.beforeUnloadHandler = () => {
            if (this.isLeader) {
                this.safePostMessage({ type: 'LEADER_RESIGNED' });
            }
        };
        window.addEventListener('beforeunload', this.beforeUnloadHandler);
    }

    private startElectionProcess() {
        if (this.destroyed) return;

        if (!this.safePostMessage({ type: 'ELECTION' })) {
            return;
        }

        if (this.electionTimeout) clearTimeout(this.electionTimeout);

        this.electionTimeout = window.setTimeout(() => {
            if (this.destroyed) return;
            const now = Date.now();
            if (now - this.lastLeaderHeartbeat > this.ELECTION_WAIT_MS) {
                this.assumeLeadership();
            } else {
                this.monitorLeader();
            }
        }, this.ELECTION_WAIT_MS);
    }

    private assumeLeadership() {
        if (this.destroyed) return;
        debugLog(`[TabSync] Asumiendo liderazgo (Tab ID: ${this.tabId})`);
        this.isLeader = true;
        this.sendHeartbeat();

        this.heartbeatInterval = window.setInterval(() => {
            this.sendHeartbeat();
        }, this.HEARTBEAT_MS);

        this.triggerListeners('LEADER_CHANGED', { isLeader: true });
    }

    private monitorLeader() {
        if (this.destroyed) return;
        if (this.monitorInterval) clearInterval(this.monitorInterval);

        this.monitorInterval = window.setInterval(() => {
            if (this.destroyed || this.isLeader) return;
            const now = Date.now();
            if (now - this.lastLeaderHeartbeat > this.LEADER_TIMEOUT_MS) {
                debugLog('[TabSync] Líder desconectado. Iniciando nueva elección...');
                this.startElectionProcess();
            }
        }, this.LEADER_TIMEOUT_MS / 2);
    }

    private sendHeartbeat() {
        this.safePostMessage({ type: 'HEARTBEAT', leaderId: this.tabId });
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        this.triggerListeners('LEADER_CHANGED', { isLeader: false });
    }

    getIsLeader(): boolean {
        return this.isLeader;
    }

    broadcast(type: string, payload: unknown) {
        this.safePostMessage({ type, payload });
    }

    on(type: string, callback: (payload: unknown) => void) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type)!.push(callback);
    }

    triggerListeners(type: string, payload: unknown) {
        if (this.destroyed) return;
        const callbacks = this.listeners.get(type);
        if (callbacks) {
            callbacks.forEach((cb) => cb(payload));
        }
    }

    destroy() {
        if (this.destroyed) return;

        if (this.isLeader) {
            try {
                this.channel.postMessage({ type: 'LEADER_RESIGNED' });
            } catch {
                /* ignore */
            }
        }

        this.destroyed = true;
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        if (this.electionTimeout) clearTimeout(this.electionTimeout);
        if (this.monitorInterval) clearInterval(this.monitorInterval);
        if (this.beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this.beforeUnloadHandler);
            this.beforeUnloadHandler = null;
        }
        this.heartbeatInterval = null;
        this.electionTimeout = null;
        this.monitorInterval = null;
        this.channel.close();
    }
}
