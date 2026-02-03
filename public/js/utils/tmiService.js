import { Auth } from '../auth.js';
import { UI } from '../ui.js';
import { AuthMessages } from './auth/messages.js';
export const TmiService = {
    client: null,
    listeners: new Map(),
    isConnected: false,
    activeClients: 0,
    connectionPromise: null,
    async connect(channel, auth) {
        this.activeClients++;
        if (this.connectionPromise)
            return this.connectionPromise;
        if (this.isConnected && this.client)
            return Promise.resolve();
        if (typeof window.tmi === 'undefined') {
            this.activeClients = Math.max(0, this.activeClients - 1);
            return Promise.reject('TMI not loaded');
        }
        const options = {
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
        const attachListeners = (clientInstance) => {
            clientInstance.on('message', (...args) => {
                const [channel, tags, message, self] = args;
                if (self)
                    return;
                this.listeners.forEach((callback) => callback(channel, tags, message));
            });
        };
        attachListeners(this.client);
        if (!this.client)
            return Promise.reject('Client initialization failed');
        this.connectionPromise = new Promise((resolve, reject) => {
            if (!this.client)
                return reject('Client not found');
            this.client
                .connect()
                .then(() => {
                    this.isConnected = true;
                    resolve();
                })
                .catch(async (err) => {
                    const isLoginError = auth &&
                        (err === 'Login unsuccessful' ||
                            (typeof err === 'string' && err.includes('Login unsuccessful')));
                    if (isLoginError) {
                        console.error('❌ TMI Auth failed. Access Token may be invalid/expired for IRC.');
                        console.warn('⚠️ Retrying anonymously...', err);
                        delete options.identity;
                        this.client = new window.tmi.Client(options);
                        attachListeners(this.client);
                        try {
                            await this.client.connect();
                            this.isConnected = true;
                            UI.showToast('Conectado al chat de forma anónima (Lectura)', 'warning');
                            resolve();
                        }
                        catch (anonErr) {
                            this.isConnected = false;
                            this.activeClients = 0;
                            reject(anonErr);
                        }
                    }
                    else {
                        console.error('❌ TMI Connection Error:', err);
                        this.isConnected = false;
                        this.activeClients = 0;
                        reject(err);
                    }
                });
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
                if (err === 'Cannot send anonymous messages' ||
                    (typeof err === 'string' &&
                        (err.includes('anonymous') || err.includes('Login unsuccessful')))) {
                    UI.showToast(AuthMessages.sessionExpired, 'error');
                    setTimeout(() => Auth.relogin(), 2000);
                }
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
