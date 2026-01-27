declare global {
    interface Window {
        tmi: any;
    }
}

export const TmiService = {
    client: null as any,
    listeners: new Map<string, Function>(),
    isConnected: false,
    activeClients: 0,
    connectionPromise: null as Promise<void> | null,

    async connect(channel: string): Promise<void> {
        this.activeClients++;

        if (this.isConnected && this.client) return Promise.resolve();

        if (typeof window.tmi === 'undefined') {
            this.activeClients--;
            return Promise.reject('TMI not loaded');
        }

        const options = {
            channels: [channel],
            connection: { secure: true, reconnect: true }
        };

        this.client = new window.tmi.Client(options);

        this.client.on('message', (channel: string, tags: any, message: string, self: boolean) => {
            if (self) return;
            this.listeners.forEach((callback: Function) => callback(channel, tags, message));
        });

        this.connectionPromise = this.client.connect()
            .then(() => { this.isConnected = true; })
            .catch((err: any) => {
                console.error('❌ TMI Connection Error:', err);
                this.isConnected = false;
                this.activeClients = 0;
            });

        return this.connectionPromise!;
    },

    addListener(id: string, callback: Function) {
        this.listeners.set(id, callback);
    },

    removeListener(id: string) {
        this.listeners.delete(id);
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
