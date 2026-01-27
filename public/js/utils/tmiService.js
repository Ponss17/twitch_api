export const TmiService = {
    client: null,
    listeners: new Map(),
    isConnected: false,
    activeClients: 0,
    connectionPromise: null,
    async connect(channel) {
        this.activeClients++;
        if (this.isConnected && this.client)
            return Promise.resolve();
        if (typeof window.tmi === 'undefined') {
            this.activeClients--;
            return Promise.reject('TMI not loaded');
        }
        const options = {
            channels: [channel],
            connection: { secure: true, reconnect: true }
        };
        this.client = new window.tmi.Client(options);
        this.client.on('message', (channel, tags, message, self) => {
            if (self)
                return;
            this.listeners.forEach((callback) => callback(channel, tags, message));
        });
        this.connectionPromise = this.client.connect()
            .then(() => { this.isConnected = true; })
            .catch((err) => {
            console.error('❌ TMI Connection Error:', err);
            this.isConnected = false;
            this.activeClients = 0;
        });
        return this.connectionPromise;
    },
    addListener(id, callback) {
        this.listeners.set(id, callback);
    },
    removeListener(id) {
        this.listeners.delete(id);
    },
    sendMessage(channel, message) {
        if (this.client && this.isConnected) {
            this.client.say(channel, message).catch((err) => {
                console.error('Error sending message:', err);
            });
        }
        else {
            console.warn('Cannot send message: TMI not connected');
        }
    },
    disconnect() {
        if (this.activeClients > 0)
            this.activeClients--;
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
