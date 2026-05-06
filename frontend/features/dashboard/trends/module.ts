import { Messages } from '../../../shared/messages/messages.js';
import { TrendsMessages, TrackerMessages } from './messages.js';
import { DASHBOARD_CONFIG } from '../dashboard-config.js';
const { IGNORED_BOTS } = DASHBOARD_CONFIG;
import { UI } from '../../../core/ui-core.js';
import { TmiService, TmiTags } from '../../../services/tmiService.js';
import { TrendsTemplates } from './templates.js';
import { Session, ChatLogItem, DashboardModule } from '../../../types.js';
import { BaseModule } from '../../../shared/utils/baseModule.js';
import { TabSyncService } from '../../../shared/utils/tabSyncService.js';

interface ITrendsModule extends DashboardModule {
    wordCounts: Record<string, number>;
    isIgnored: Set<string>;
    messageLog: ChatLogItem[];
    MAX_LOG_SIZE: number;
    isTracking: boolean;
    isConnected: boolean;
    timerInterval: ReturnType<typeof setInterval> | null;
    cssLoaded: boolean;
    renderPending: boolean;
    uiInitialized: boolean;
    syncService: TabSyncService | null;
    updateUIState(): void;
    setupUI(): void;
    setupSyncListeners(): void;
    attachListeners(): void;
    processMessage(msg: string): void;
    connect(): void;
    updateStatus(connected: boolean): void;
    startTimer(): void;
    runTimer(seconds: number): void;
    endTimer(): void;
    formatTime(s: number): string;
    reset(): void;
    getMessagesByUser(username: string): ChatLogItem[];
    render(): void;
}

export const TrendsModule: ITrendsModule = {
    ...BaseModule,
    wordCounts: {} as Record<string, number>,
    isIgnored: new Set([
        'el',
        'la',
        'los',
        'las',
        'un',
        'una',
        'unos',
        'unas',
        'y',
        'o',
        'pero',
        'si',
        'no',
        'en',
        'de',
        'del',
        'a',
        'al',
        'con',
        'para',
        'por',
        'que',
        'qué',
        'es',
        'son',
        'se',
        'mi',
        'tu',
        'su',
        'yo',
        'me',
        'te',
        'le',
        'este',
        'esta',
        'estos',
        'estas',
        'ese',
        'esa',
        'esos',
        'esas',
        'como',
        'cómo',
        'cuando',
        'cuándo',
        'donde',
        'dónde',
        'quien',
        'quién',
        'solo',
        'sólo',
        'tan',
        'muy',
        'mucho',
        'poco',
        'más',
        'menos',
        'http',
        'https',
        'www',
        'com'
    ]),
    messageLog: [] as ChatLogItem[],
    MAX_LOG_SIZE: 500,
    isTracking: false,
    isConnected: false,
    timerInterval: null as ReturnType<typeof setInterval> | null,
    session: null,
    initialized: false,

    cssLoaded: false,
    uiInitialized: false,
    syncService: null,

    init(session: Session): void {
        this.initBase(session, 'css/sections/trends.css');
    },

    activate() {
        if (!this.uiInitialized) {
            this.setupUI();
            this.updateUIState();

            if (!this.syncService) {
                this.syncService = new TabSyncService('dashboard_trends_sync');
                this.setupSyncListeners();
            }

            this.uiInitialized = true;
        }
    },

    setupSyncListeners() {
        if (!this.syncService) return;

        this.syncService.on('TRENDS_START', (payload: unknown) => {
            const minutes = payload as number;
            this.isTracking = true;
            document.getElementById('tracker-input-container')?.classList.add('hidden');
            document.getElementById('tracker-timer')?.classList.remove('hidden');
            this.wordCounts = {};
            this.messageLog = [];
            this.runTimer(minutes * 60);
            this.render();
            if (!this.syncService?.getIsLeader()) {
                UI.showToast(
                    TrackerMessages.startedRaw(minutes),
                    'success',
                    'fa-hourglass-start fa-spin'
                );
            }
        });

        this.syncService.on('TRENDS_UPDATE_COUNTS', (payload: unknown) => {
            const data = payload as { counts: Record<string, number>; log: ChatLogItem[] };
            this.wordCounts = data.counts;
            this.messageLog = data.log.slice(0, 50);
            this.render();
        });

        this.syncService.on('TRENDS_END', () => {
            this.localEndTimer();
        });

        this.syncService.on('TRENDS_RESET', () => {
            this.localReset();
        });

        this.syncService.on('LEADER_CHANGED', (payload: unknown) => {
            const data = payload as { isLeader: boolean };
            if (data.isLeader && this.isTracking && !this.isConnected) {
                this.connect();
            } else if (!data.isLeader && this.isConnected) {
                TmiService.disconnect();
                this.isConnected = false;
                this.updateStatus(false);
            }
        });
    },

    updateUIState() {
        if (!this.session) return;
        const { login, displayName, profile_image_url } = this.session;
        const titleEl = document.getElementById('tracker-title');
        if (titleEl) titleEl.textContent = TrendsMessages.title(displayName || login);

        const avatarEl = document.getElementById('tracker-avatar') as HTMLImageElement;
        const iconEl = document.getElementById('tracker-icon');
        if (profile_image_url && avatarEl && iconEl) {
            avatarEl.src = profile_image_url;
            avatarEl.style.display = 'block';
            iconEl.style.display = 'none';
        }
        this.render();
    },

    setupUI() {
        this.attachListeners();
    },

    attachListeners() {
        const resetBtn = document.getElementById('reset-tracker-btn');
        const startBtn = document.getElementById('start-timer-btn');

        if (resetBtn && !resetBtn.dataset.listener) {
            resetBtn.addEventListener('click', () => this.reset());
            resetBtn.dataset.listener = 'true';
        }

        if (startBtn && !startBtn.dataset.listener) {
            startBtn.addEventListener('click', () => this.startTimer());
            startBtn.dataset.listener = 'true';
        }
    },

    connect() {
        if (!this.session) return;

        const auth = this.session.token
            ? {
                  username: this.session.login,
                  token: this.session.token
              }
            : undefined;

        TmiService.connect(this.session.login, auth)
            .then(() => {
                this.updateStatus(true);
                this.isConnected = true;
                TmiService.addListener('trends', (chn: string, tags: TmiTags, message: string) => {
                    if (!this.isTracking) return;
                    const username = tags.username;
                    if (!username || IGNORED_BOTS.has(username.toLowerCase())) return;

                    this.messageLog.unshift({ user: username, text: message, time: new Date() });
                    if (this.messageLog.length > this.MAX_LOG_SIZE) this.messageLog.pop();

                    this.processMessage(message);
                });
            })
            .catch((err: unknown) => {
                console.error('Trends TMI Error:', err);
                this.updateStatus(false);
                UI.showToast(
                    Messages.Common.connectionError || 'Error connecting to chat',
                    'error'
                );
                this.endTimer();
            });
    },

    updateStatus(connected: boolean) {
        const el = document.getElementById('tracker-status');
        if (!el) return;
        if (connected) {
            el.innerHTML = TrackerMessages.connected;
            el.style.color = 'var(--success)';
        } else {
            el.innerHTML = !this.isTracking ? TrackerMessages.resting : TrackerMessages.error;
            el.style.color = !this.isTracking ? 'var(--text-muted)' : 'var(--danger)';
        }
    },

    startTimer() {
        if (this.isTracking) return;

        const minutes =
            parseInt((document.getElementById('tracker-minutes') as HTMLInputElement)?.value) || 5;

        this.syncService?.broadcast('TRENDS_START', minutes);

        this.isTracking = true;
        if (this.syncService?.getIsLeader()) {
            this.connect();
            fetch(`${DASHBOARD_CONFIG.API_ENDPOINTS.BASE}/dashboard/track-usage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
                body: JSON.stringify({ tool: 'trends' })
            }).catch((e) => console.warn('Error tracking trends usage:', e));
        }

        document.getElementById('tracker-input-container')?.classList.add('hidden');
        document.getElementById('tracker-timer')?.classList.remove('hidden');

        this.wordCounts = {};
        this.messageLog = [];
        this.runTimer(minutes * 60);
        this.render();
        UI.showToast(TrackerMessages.startedRaw(minutes), 'success', 'fa-hourglass-start fa-spin');
    },

    runTimer(seconds: number) {
        let remaining = seconds;
        const display = document.getElementById('tracker-timer');
        if (display) {
            display.classList.remove('hidden', 'text-warning', 'text-accent');
            display.classList.add('text-primary');
        }

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            remaining--;
            if (display) display.textContent = this.formatTime(remaining);
            if (remaining <= 0) this.endTimer();
        }, 1000);
    },

    endTimer() {
        this.syncService?.broadcast('TRENDS_END', null);
        this.localEndTimer();
    },

    localEndTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.isTracking = false;
        if (this.syncService?.getIsLeader()) {
            TmiService.disconnect();
            this.isConnected = false;
        }
        this.updateStatus(false);

        const display = document.getElementById('tracker-timer');
        display?.classList.replace('text-primary', 'text-warning');

        const entries = Object.entries(this.wordCounts);
        if (entries.length > 0) {
            const sorted = entries.sort((a, b) => (b[1] as number) - (a[1] as number));
            UI.showToast(TrackerMessages.winner(sorted[0][0], sorted[0][1] as number), 'success');
        } else {
            UI.showToast(TrackerMessages.finishedRaw, 'success', 'fa-flag-checkered');
        }
        this.render();
    },

    formatTime(s: number) {
        const m = Math.floor(s / 60);
        return `${m}:${(s % 60).toString().padStart(2, '0')}`;
    },

    processMessage(msg: string) {
        const firstWord = msg
            .toLowerCase()
            .split(/\s+/)[0]
            ?.replace(/[^\wñáéíóúü]/g, '');
        if (firstWord && firstWord.length > 2 && !this.isIgnored.has(firstWord)) {
            this.wordCounts[firstWord] = (this.wordCounts[firstWord] || 0) + 1;
            this.render();
            if (this.syncService?.getIsLeader()) {
                this.syncService.broadcast('TRENDS_UPDATE_COUNTS', {
                    counts: this.wordCounts,
                    log: this.messageLog.slice(0, 20)
                });
            }
        }
    },

    reset() {
        this.syncService?.broadcast('TRENDS_RESET', null);
        this.localReset();
    },

    localReset() {
        this.wordCounts = {};
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.isTracking = false;

        if (this.syncService?.getIsLeader() || this.isConnected) {
            TmiService.removeListener('trends');
            TmiService.disconnect();
            this.isConnected = false;
        }
        this.updateStatus(false);

        document.getElementById('tracker-input-container')?.classList.remove('hidden');
        document.getElementById('tracker-timer')?.classList.add('hidden');
        this.render();
    },

    renderPending: false,

    getMessagesByUser(username: string) {
        return this.messageLog.filter(
            (log: ChatLogItem) => log.user.toLowerCase() === username.toLowerCase()
        );
    },

    deactivate() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        TmiService.removeListener('trends');
        TmiService.disconnect();
        this.isConnected = false;
        this.isTracking = false;
        if (this.syncService) {
            this.syncService.destroy();
            this.syncService = null;
        }
    },

    render() {
        if (this.renderPending) return;
        this.renderPending = true;
        requestAnimationFrame(() => {
            const tbody = document.getElementById('tracker-body');
            if (tbody) {
                if (!this.isTracking && Object.keys(this.wordCounts).length === 0) {
                    tbody.innerHTML = TrackerMessages.ready;
                } else {
                    const entries = Object.entries(this.wordCounts)
                        .sort((a, b) => (b[1] as number) - (a[1] as number))
                        .slice(0, 10);
                    if (entries.length === 0) {
                        tbody.innerHTML = TrackerMessages.waiting;
                    } else {
                        const maxCount = entries[0][1] as number;
                        tbody.innerHTML = entries
                            .map((item, i) =>
                                TrendsTemplates.renderRow(item as [string, number], i, maxCount)
                            )
                            .join('');
                    }
                }
            }
            this.renderPending = false;
        });
    }
};
