export const TmiService = {
    client: null,
    callbacks: [],
    isConnected: false,
    activeClients: 0,

    async connect(channel, identity = null) {
        this.activeClients++;
        console.log(`[TmiService] Client added. Active: ${this.activeClients}`);

        if (this.isConnected && this.client) {
            return Promise.resolve();
        }

        if (this.activeClients > 1) {
            return this.connectionPromise || Promise.resolve();
        }

        if (typeof window.tmi === 'undefined') {
            console.warn('TMI.js not loaded yet');
            this.activeClients--;
            return Promise.reject('TMI not loaded');
        }

        const options = {
            channels: [channel],
            connection: { secure: true, reconnect: true }
        };

        this.client = new window.tmi.Client(options);

        this.client.on('message', (channel, tags, message, self) => {
            if (self) return;
            this.callbacks.forEach(cb => cb(channel, tags, message));
        });

        this.connectionPromise = this.client.connect()
            .then(() => {
                this.isConnected = true;
                console.log('✅ [TmiService] Connected to Twitch');
            })
            .catch(err => {
                console.error('❌ TMI Connection Error:', err);
                this.isConnected = false;
                this.activeClients = 0;
            });

        return this.connectionPromise;
    },

    addMessageListener(callback) {
        this.callbacks.push(callback);
    },

    disconnect() {
        if (this.activeClients > 0) {
            this.activeClients--;
        }

        console.log(`[TmiService] Client removed. Active: ${this.activeClients}`);

        if (this.activeClients === 0 && this.client && this.isConnected) {
            console.log('💤 [TmiService] No active clients. Disconnecting...');
            this.client.disconnect().then(() => {
                this.isConnected = false;
                this.client = null;
                this.connectionPromise = null;
                console.log('🛑 [TmiService] Disconnected');
            });
        }
    }
};
