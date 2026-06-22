import type { Client, Options } from 'tmi.js';

export interface TmiTags {
    username?: string;
    'display-name'?: string;
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

class TmiChatService {
    client: Client | null = null;
    private listeners = new Map<string, MessageHandler>();
    private activeClients = 0;
    private connectionPromise: Promise<void> | null = null;
    isConnected = false;

    async connect(
        channel: string,
        auth?: { username: string; token: string },
        onAnonymous?: () => void
    ): Promise<void> {
        this.activeClients++;
        if (this.connectionPromise) return this.connectionPromise;
        if (this.isConnected && this.client) return Promise.resolve();

        const tmi = await loadTmi();
        const normalized = channel.replace(/^#/, '').toLowerCase();
        const opts: Options = {
            channels: [normalized],
            connection: { secure: true, reconnect: true },
            options: { skipUpdatingEmotesets: true, messages: { emotes: false } }
        };

        if (auth?.username && auth?.token) {
            opts.identity = {
                username: auth.username,
                password: `oauth:${auth.token.replace(/^oauth:/, '')}`
            };
        }

        const attach = (client: Client) => {
            client.on('message', (_channel, tags, message, self) => {
                if (self) return;
                const t: TmiTags = {
                    username: tags.username,
                    'display-name': tags['display-name']
                };
                this.listeners.forEach((cb) => cb(_channel, t, message));
            });
        };

        this.client = new tmi.Client(opts);
        attach(this.client);

        this.connectionPromise = this.client
            .connect()
            .then(() => {
                this.isConnected = true;
            })
            .catch(async (err: unknown) => {
                const msg = String(err);
                const isLoginError = auth && msg.includes('Login unsuccessful');

                if (isLoginError) {
                    delete opts.identity;
                    this.client = new tmi.Client(opts);
                    attach(this.client!);
                    try {
                        await this.client!.connect();
                        this.isConnected = true;
                        onAnonymous?.();
                    } catch (anonErr) {
                        this.resetConnection();
                        throw anonErr;
                    }
                } else {
                    this.resetConnection();
                    throw err;
                }
            })
            .then(() => undefined);

        return this.connectionPromise;
    }

    addListener(id: string, callback: MessageHandler) {
        this.listeners.set(id, callback);
    }

    removeListener(id: string) {
        this.listeners.delete(id);
    }

    async say(channel: string, message: string): Promise<void> {
        if (this.client && this.isConnected) {
            await this.client.say(channel, message);
        }
    }

    disconnect() {
        if (this.activeClients > 0) this.activeClients--;

        if (this.activeClients <= 0 && this.client && this.isConnected) {
            void this.client.disconnect().then(() => this.resetConnection());
        }
    }

    forceDisconnect() {
        this.activeClients = 0;
        if (this.client) {
            void this.client.disconnect().then(() => this.resetConnection());
        } else {
            this.resetConnection();
        }
    }

    private resetConnection() {
        this.isConnected = false;
        this.client = null;
        this.connectionPromise = null;
        this.listeners.clear();
        this.activeClients = 0;
    }
}

export const tmiService = new TmiChatService();

export function getTmiAuth(session: { login?: string; token?: string }) {
    if (!session.token || !session.login) return undefined;
    return { username: session.login, token: session.token };
}
