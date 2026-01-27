export interface TmiTags {
    username: string;
    'display-name'?: string;
    [key: string]: any;
}

declare global {
    interface Window {
        tmi: any;
    }
}

export const TmiService = {
    client: null as any,
    listeners: new Map<string, (channel: string, tags: TmiTags, message: string) => void>(),
    isConnected: false,
    activeClients: 0,
    connectionPromise: null as Promise<void> | null,

    async connect(channel: string, auth?: { username: string, token: string }): Promise<void> {
        this.activeClients++;

        if (this.isConnected && this.client) return Promise.resolve();

        if (typeof window.tmi === 'undefined') {
            this.activeClients--;
            return Promise.reject('TMI not loaded');
        }

        const options: any = {
            channels: [channel],
            connection: { secure: true, reconnect: true }
        };

        if (auth) {
            options.identity = {
                username: auth.username,
                password: `oauth:${auth.token.replace('oauth:', '')}`
            };
        }

        this.client = new window.tmi.Client(options);

        const attachListeners = (clientInstance: any) => {
            clientInstance.on('message', (channel: string, tags: TmiTags, message: string, self: boolean) => {
                if (self) return;
                this.listeners.forEach((callback) => callback(channel, tags, message));
            });
        };

        attachListeners(this.client);

        this.connectionPromise = new Promise<void>((resolve, reject) => {
            this.client.connect()
                .then(() => {
                    this.isConnected = true;
                    resolve();
                })
                .catch(async (err: any) => {
                    console.error('❌ TMI Connection Error:', err);
                    
                    if (auth && (err === 'Login unsuccessful' || (typeof err === 'string' && err.includes('Login unsuccessful')))) {
                        console.warn('🔄 Retrying with anonymous connection...');
                        delete options.identity;
                        this.client = new window.tmi.Client(options);
                        attachListeners(this.client);
                        
                        try {
                            await this.client.connect();
                            this.isConnected = true;
                            resolve();
                        } catch (anonErr) {
                            this.isConnected = false;
                            this.activeClients = 0;
                            reject(anonErr);
                        }
                    } else {
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
            this.client.say(channel, message).catch((err: any) => {
                console.error('Error sending message:', err);
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
