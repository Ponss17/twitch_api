export type SyncMessage = {
    type: string;
    payload?: any;
    leaderId?: string;
};

export class TabSyncService {
    private channel: BroadcastChannel;
    private isLeader = false;
    private tabId = crypto.randomUUID();
    private electionTimeout: number | null = null;
    private heartbeatInterval: number | null = null;
    private listeners: Map<string, ((payload: any) => void)[]> = new Map();

    private readonly ELECTION_WAIT_MS = 1500;
    private readonly HEARTBEAT_MS = 3000;
    private readonly LEADER_TIMEOUT_MS = 6000;

    private lastLeaderHeartbeat = 0;
    private currentLeaderId: string | null = null;

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
                this.currentLeaderId = msg.leaderId || null;
                if (this.isLeader && msg.leaderId !== this.tabId) {
                    if (this.tabId > (msg.leaderId || '')) {
                        this.isLeader = false;
                        this.stopHeartbeat();
                        console.log('[TabSync] Cediendo liderazgo a otra pestaña.');
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

        window.addEventListener('beforeunload', () => {
            if (this.isLeader) {
                this.channel.postMessage({ type: 'LEADER_RESIGNED' });
            }
        });
    }

    private startElectionProcess() {
        this.channel.postMessage({ type: 'ELECTION' });

        this.electionTimeout = window.setTimeout(() => {
            const now = Date.now();
            if (now - this.lastLeaderHeartbeat > this.ELECTION_WAIT_MS) {
                this.assumeLeadership();
            } else {
                this.monitorLeader();
            }
        }, this.ELECTION_WAIT_MS);
    }

    private assumeLeadership() {
        console.log(`[TabSync] Asumiendo liderazgo (Tab ID: ${this.tabId})`);
        this.isLeader = true;
        this.currentLeaderId = this.tabId;
        this.sendHeartbeat();

        this.heartbeatInterval = window.setInterval(() => {
            this.sendHeartbeat();
        }, this.HEARTBEAT_MS);

        this.triggerListeners('LEADER_CHANGED', { isLeader: true });
    }

    private monitorLeader() {
        setInterval(() => {
            if (this.isLeader) return;
            const now = Date.now();
            if (now - this.lastLeaderHeartbeat > this.LEADER_TIMEOUT_MS) {
                console.log('[TabSync] Líder desconectado. Iniciando nueva elección...');
                this.startElectionProcess();
            }
        }, this.LEADER_TIMEOUT_MS / 2);
    }

    private sendHeartbeat() {
        this.channel.postMessage({ type: 'HEARTBEAT', leaderId: this.tabId });
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        this.triggerListeners('LEADER_CHANGED', { isLeader: false });
    }

    public getIsLeader(): boolean {
        return this.isLeader;
    }

    public broadcast(type: string, payload: any) {
        this.channel.postMessage({ type, payload });
    }

    public on(type: string, callback: (payload: any) => void) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type)!.push(callback);
    }

    public triggerListeners(type: string, payload: any) {
        const callbacks = this.listeners.get(type);
        if (callbacks) {
            callbacks.forEach((cb) => cb(payload));
        }
    }

    public destroy() {
        if (this.isLeader) {
            this.channel.postMessage({ type: 'LEADER_RESIGNED' });
        }
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        if (this.electionTimeout) clearTimeout(this.electionTimeout);
        this.channel.close();
    }
}
