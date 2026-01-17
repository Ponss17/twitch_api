export const TmiService = {
    client: null,
    callbacks: [],
    isConnected: false,

    init(channel, identity = null) {
        if (this.client) return Promise.resolve();
        if (typeof window.tmi === 'undefined') {
            console.warn('TMI.js not loaded yet');
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

        return this.client.connect()
            .then(() => {
                this.isConnected = true;
            })
            .catch(err => {
                console.error('❌ TMI Connection Error:', err);
                this.isConnected = false;
            });
    },

    addMessageListener(callback) {
        this.callbacks.push(callback);
    },

    disconnect() {
        if (this.client) {
            this.client.disconnect();
            this.client = null;
            this.isConnected = false;
        }
    }
};
