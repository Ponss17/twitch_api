import type { Client, Options } from 'tmi.js';

export interface TmiTags {
    username?: string;
    'display-name'?: string;
    mod?: boolean | string | number;
    subscriber?: boolean | string | number;
    vip?: boolean | string | number;
    badges?: Record<string, string> | string;
    [key: string]: unknown;
}

type MessageHandler = (channel: string, tags: TmiTags, message: string) => void;

type TmiDefault = { Client: typeof Client };

let tmiLib: TmiDefault | null = null;

async function loadTmi(): Promise<TmiDefault> {
    if (!tmiLib) {
        const mod = await import('tmi.js');
        tmiLib = (mod.default ?? mod) as TmiDefault;
    }
    return tmiLib;
}

export class TmiChatService {
    private client: Client | null = null;
    private listeners = new Map<string, MessageHandler>();
    private activeClients = 0;
    private connectionPromise: Promise<void> | null = null;
    private _isConnected = false;
    private activeConnectionKey: string | null = null;
    private generation = 0;

    public get isConnected(): boolean {
        return this._isConnected;
    }

    private acquireClient(): void {
        this.activeClients++;
    }

    async connect(
        channel: string,
        auth?: { username: string; token: string },
        onAnonymous?: () => void
    ): Promise<void> {
        this.acquireClient();
        const normalized = channel.replace(/^#/, '').toLowerCase();
        const authKey = auth?.username && auth.token
            ? `${auth.username.toLowerCase()}:${auth.token}`
            : 'anonymous';
        const connectionKey = `${normalized}|${authKey}`;

        if (this.activeConnectionKey === connectionKey) {
            if (this.connectionPromise) return this.connectionPromise;
            if (this._isConnected && this.client) return;
        }

        const previousClient = this.client;
        const generation = ++this.generation;
        this.activeConnectionKey = connectionKey;
        this.client = null;
        this._isConnected = false;
        if (previousClient) void previousClient.disconnect().catch(() => undefined);

        const promise = this.establishConnection(
            normalized,
            auth,
            onAnonymous,
            connectionKey,
            generation
        );
        this.connectionPromise = promise;
        try {
            await promise;
        } finally {
            if (this.generation === generation && this.connectionPromise === promise) {
                this.connectionPromise = null;
            }
        }
    }

    addListener(id: string, callback: MessageHandler) {
        this.listeners.set(id, callback);
    }

    removeListener(id: string) {
        this.listeners.delete(id);
    }

    async say(channel: string, message: string): Promise<void> {
        if (this.client && this._isConnected) {
            await this.client.say(channel, message);
        }
    }

    disconnect(): void {
        if (this.activeClients > 0) this.activeClients--;

        if (this.activeClients > 0 || this.listeners.size > 0) return;

        ++this.generation;
        const client = this.client;
        this.resetConnection();
        if (client) void client.disconnect().catch(() => undefined);
    }

    private async establishConnection(
        channel: string,
        auth: { username: string; token: string } | undefined,
        onAnonymous: (() => void) | undefined,
        connectionKey: string,
        generation: number
    ): Promise<void> {
        const tmi = await loadTmi();
        if (!this.isCurrent(connectionKey, generation)) return;

        const opts: Options = {
            channels: [channel],
            connection: { secure: true, reconnect: true },
            options: { skipUpdatingEmotesets: true, messages: { emotes: false } }
        };
        if (auth?.username && auth.token) {
            opts.identity = {
                username: auth.username,
                password: `oauth:${auth.token.replace(/^oauth:/, '')}`
            };
        }

        let client = new tmi.Client(opts);
        this.attach(client, generation);
        this.client = client;

        try {
            await client.connect();
        } catch (err) {
            const isLoginError = Boolean(auth) && String(err).includes('Login unsuccessful');
            if (!isLoginError || !this.isCurrent(connectionKey, generation)) throw err;

            await client.disconnect().catch(() => undefined);
            delete opts.identity;
            client = new tmi.Client(opts);
            this.attach(client, generation);
            this.client = client;
            await client.connect();
            if (!this.isCurrent(connectionKey, generation)) {
                await client.disconnect().catch(() => undefined);
                return;
            }
            onAnonymous?.();
        }

        if (!this.isCurrent(connectionKey, generation)) {
            await client.disconnect().catch(() => undefined);
            return;
        }
        this._isConnected = true;
    }

    private attach(client: Client, generation: number): void {
        client.on('message', (_channel, tags, message, self) => {
            if (self || generation !== this.generation || client !== this.client) return;
            const t: TmiTags = {
                username: tags.username,
                'display-name': tags['display-name'],
                mod: tags.mod as TmiTags['mod'],
                subscriber: tags.subscriber as TmiTags['subscriber'],
                vip: tags.vip as TmiTags['vip'],
                badges: tags.badges as TmiTags['badges']
            };
            this.listeners.forEach((cb) => cb(_channel, t, message));
        });
    }

    private isCurrent(connectionKey: string, generation: number): boolean {
        return (
            generation === this.generation &&
            connectionKey === this.activeConnectionKey &&
            this.activeClients > 0
        );
    }

    private resetConnection(): void {
        this._isConnected = false;
        this.client = null;
        this.connectionPromise = null;
        this.activeConnectionKey = null;
    }
}

export const tmiService = new TmiChatService();

export function getTmiAuth(session: { login?: string; token?: string }) {
    if (!session.token || !session.login) return undefined;
    return { username: session.login, token: session.token };
}
