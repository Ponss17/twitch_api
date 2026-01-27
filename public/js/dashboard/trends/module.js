import { Messages } from '../../utils/messages.js';
import { CONFIG } from '../../config.js';
import { UI } from '../../ui.js';
import { TmiService } from '../../utils/tmiService.js';
import { TrendsTemplates } from './templates.js';
export const TrendsModule = {
    wordCounts: {},
    isIgnored: new Set([
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
        'y', 'o', 'pero', 'si', 'no', 'en', 'de', 'del', 'a', 'al', 'con', 'para', 'por',
        'que', 'qué', 'es', 'son', 'se', 'mi', 'tu', 'su', 'yo', 'me', 'te', 'le',
        'http', 'https', 'www', 'com'
    ]),
    messageLog: [],
    MAX_LOG_SIZE: 500,
    isTracking: false,
    isConnected: false,
    timerInterval: null,
    session: null,
    init(session) {
        this.session = session;
        import('../../utils/loader.js').then(({ Loader }) => {
            Loader.loadCSS('css/sections/trends.css');
        });
        this.setupUI();
    },
    setupUI() {
        if (!this.session)
            return;
        const { login, displayName, profile_image_url } = this.session;
        const titleEl = document.getElementById('tracker-title');
        if (titleEl)
            titleEl.textContent = Messages.Trends.title(displayName || login);
        const avatarEl = document.getElementById('tracker-avatar');
        const iconEl = document.getElementById('tracker-icon');
        if (profile_image_url && avatarEl && iconEl) {
            avatarEl.src = profile_image_url;
            avatarEl.style.display = 'block';
            iconEl.style.display = 'none';
        }
        this.attachListeners();
        this.render();
    },
    attachListeners() {
        document.getElementById('reset-tracker-btn')?.addEventListener('click', () => this.reset());
        document.getElementById('start-timer-btn')?.addEventListener('click', () => this.startTimer());
    },
    connect() {
        if (!this.session)
            return;
        TmiService.connect(this.session.login).then(() => {
            this.updateStatus(true);
            this.isConnected = true;
            TmiService.addListener('trends', (chn, tags, message) => {
                if (!this.isTracking)
                    return;
                const username = tags.username;
                if (!username || CONFIG.IGNORED_BOTS.has(username.toLowerCase()))
                    return;
                this.messageLog.unshift({ user: username, text: message, time: new Date() });
                if (this.messageLog.length > this.MAX_LOG_SIZE)
                    this.messageLog.pop();
                this.processMessage(message);
            });
        }).catch(() => this.updateStatus(false));
    },
    updateStatus(connected) {
        const el = document.getElementById('tracker-status');
        if (!el)
            return;
        if (connected) {
            el.innerHTML = Messages.Tracker.connected;
            el.style.color = 'var(--success)';
        }
        else {
            el.innerHTML = !this.isTracking ? Messages.Tracker.resting : Messages.Tracker.error;
            el.style.color = !this.isTracking ? 'var(--text-muted)' : 'var(--danger)';
        }
    },
    startTimer() {
        this.isTracking = true;
        this.connect();
        const minutes = parseInt(document.getElementById('tracker-minutes')?.value) || 5;
        document.getElementById('tracker-input-container')?.classList.add('hidden');
        document.getElementById('tracker-timer')?.classList.remove('hidden');
        this.wordCounts = {};
        this.messageLog = [];
        this.runTimer(minutes * 60);
        this.render();
        UI.showToast(Messages.Tracker.started(minutes), 'success');
    },
    runTimer(seconds) {
        let remaining = seconds;
        const display = document.getElementById('tracker-timer');
        if (display) {
            display.classList.remove('hidden', 'text-warning', 'text-accent');
            display.classList.add('text-primary');
        }
        if (this.timerInterval)
            clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            remaining--;
            if (display)
                display.textContent = this.formatTime(remaining);
            if (remaining <= 0)
                this.endTimer();
        }, 1000);
    },
    endTimer() {
        if (this.timerInterval)
            clearInterval(this.timerInterval);
        this.isTracking = false;
        TmiService.disconnect();
        this.isConnected = false;
        this.updateStatus(false);
        const display = document.getElementById('tracker-timer');
        display?.classList.replace('text-primary', 'text-warning');
        const entries = Object.entries(this.wordCounts);
        if (entries.length > 0) {
            const sorted = entries.sort((a, b) => b[1] - a[1]);
            UI.showToast(Messages.Tracker.winner(sorted[0][0], sorted[0][1]), 'success');
        }
        this.render();
    },
    formatTime(s) {
        const m = Math.floor(s / 60);
        return `${m}:${(s % 60).toString().padStart(2, '0')}`;
    },
    processMessage(msg) {
        const firstWord = msg.toLowerCase().split(/\s+/)[0]?.replace(/[^\wñáéíóúü]/g, '');
        if (firstWord && firstWord.length > 2 && !this.isIgnored.has(firstWord)) {
            this.wordCounts[firstWord] = (this.wordCounts[firstWord] || 0) + 1;
            this.render();
        }
    },
    reset() {
        this.wordCounts = {};
        if (this.timerInterval)
            clearInterval(this.timerInterval);
        this.isTracking = false;
        TmiService.removeListener('trends');
        TmiService.disconnect();
        this.isConnected = false;
        this.updateStatus(false);
        document.getElementById('tracker-input-container')?.classList.remove('hidden');
        document.getElementById('tracker-timer')?.classList.add('hidden');
        this.render();
    },
    renderPending: false,
    getMessagesByUser(username) {
        return this.messageLog.filter((log) => log.user.toLowerCase() === username.toLowerCase());
    },
    render() {
        if (this.renderPending)
            return;
        this.renderPending = true;
        requestAnimationFrame(() => {
            const tbody = document.getElementById('tracker-body');
            if (tbody) {
                if (!this.isTracking && Object.keys(this.wordCounts).length === 0) {
                    tbody.innerHTML = Messages.Tracker.ready;
                }
                else {
                    const entries = Object.entries(this.wordCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
                    if (entries.length === 0) {
                        tbody.innerHTML = Messages.Tracker.waiting;
                    }
                    else {
                        const maxCount = entries[0][1];
                        tbody.innerHTML = entries.map((item, i) => TrendsTemplates.renderRow(item, i, maxCount)).join('');
                    }
                }
            }
            this.renderPending = false;
        });
    }
};
