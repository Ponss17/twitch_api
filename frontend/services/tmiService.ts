import { Auth } from '../core/auth.js';
import { UI } from '../core/ui.js';
import { AuthMessages } from '../shared/i18n/authMessages.js';

export interface TmiTags {
    username: string;
    'display-name'?: string;
    [key: string]: string | number | boolean | string[] | undefined;
}

interface TmiOptions {
    channels: string[];
    connection?: { secure?: boolean; reconnect?: boolean };
    identity?: { username: string; password?: string };
    options?: {
        skipUpdatingEmotesets?: boolean;
        messages?: { emotes?: boolean };
    };
}

interface TmiClient {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    on: (event: string, callback: (...args: unknown[]) => void) => void;
    say: (channel: string, message: string) => Promise<string[]>;
}

declare global {
    interface Window {
        tmi: {
            Client: new (options: TmiOptions) => TmiClient;
        };
    }
}

export const TmiService = {
    client: null as TmiClient | null,
    listeners: new Map<string, (channel: string, tags: TmiTags, message: string) => void>(),
    isConnected: false,
    activeClients: 0,
    connectionPromise: null as Promise<void> | null,

    async connect(channel: string, auth?: { username: string; token: string }): Promise<void> {
        this.activeClients++;

        if (this.connectionPromise) return this.connectionPromise;
        if (this.isConnected && this.client) return Promise.resolve();

        if (typeof window.tmi === 'undefined') {
            this.activeClients = Math.max(0, this.activeClients - 1);
            return Promise.reject('TMI not loaded');
        }

        const options: TmiOptions = {
            channels: [channel],
            connection: { secure: true, reconnect: true },
            options: {
                skipUpdatingEmotesets: true,
                messages: {
                    emotes: false
                }
            }
        };

        if (auth) {
            options.identity = {
                username: auth.username,
                password: `oauth:${auth.token.replace('oauth:', '')}`
            };
        }

        this.client = new window.tmi.Client(options);

        const attachListeners = (clientInstance: TmiClient) => {
            clientInstance.on('message', (...args: unknown[]) => {
                const [channel, tags, message, self] = args as [string, TmiTags, string, boolean];
                if (self) return;
                this.listeners.forEach((callback) => callback(channel, tags, message));
            });
        };

        attachListeners(this.client);

        if (!this.client) return Promise.reject('Client initialization failed');

        this.connectionPromise = new Promise<void>((resolve, reject) => {
            if (!this.client) return reject('Client not found');
            this.client
                .connect()
                .then(() => {
                    this.isConnected = true;
                    resolve();
                })
                .catch(async (err: string | Error) => {
                    const isLoginError =
                        auth &&
                        (err === 'Login unsuccessful' ||
                            (typeof err === 'string' && err.includes('Login unsuccessful')));

                    if (isLoginError) {
                        console.error(
                            '❌ TMI Auth failed. Access Token may be invalid/expired for IRC.'
                        );

                        console.warn('⚠️ Retrying anonymously...', err);
                        delete options.identity;
                        this.client = new window.tmi.Client(options);
                        attachListeners(this.client);

                        try {
                            await this.client.connect();
                            this.isConnected = true;
                            UI.showToast('Conectado al chat de forma anónima (Lectura)', 'warning');
                            resolve();
                        } catch (anonErr) {
                            this.isConnected = false;
                            this.activeClients = 0;
                            reject(anonErr);
                        }
                    } else {
                        console.error('❌ TMI Connection Error:', err);
                        this.isConnected = false;
                        this.activeClients = 0;
                        reject(err);
                    }
                });
        });

        return this.connectionPromise;
    },

    addListener(id: string, callback: (channel: string, tags: TmiTags, message: string) => void) {
        this.listeners.set(id, callback);
    },

    removeListener(id: string) {
        this.listeners.delete(id);
    },

    sendMessage(channel: string, message: string) {
        if (this.client && this.isConnected) {
            this.client.say(channel, message).catch((err: unknown) => {
                console.error('Error sending message:', err);
                if (
                    err === 'Cannot send anonymous messages' ||
                    (typeof err === 'string' &&
                        (err.includes('anonymous') || err.includes('Login unsuccessful')))
                ) {
                    UI.showToast(AuthMessages.sessionExpired, 'error');
                    setTimeout(() => Auth.relogin(), 2000);
                }
            });
        } else {
            console.warn('Cannot send message: TMI not connected');
        }
    },

    disconnect() {
        if (this.activeClients > 0) this.activeClients--;

        if (this.activeClients === 0 && this.client && this.isConnected) {
            this.client.disconnect().then(() => {
                this.isConnected = false;
                this.client = null;
                this.connectionPromise = null;
                this.listeners.clear();
            });
        }
    }
};
