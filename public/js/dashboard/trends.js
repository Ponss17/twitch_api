import { Messages } from '../utils/messages.js';
import { CONFIG } from '../config.js';
import { Loader } from '../utils/loader.js';
import { UI } from '../ui.js';

export const TrendsModule = {
    client: null,
    wordCounts: {},
    isIgnored: new Set([
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
        'y', 'o', 'pero', 'si', 'no', 'en', 'de', 'del', 'a', 'al', 'con', 'para', 'por',
        'que', 'qué', 'es', 'son', 'se', 'mi', 'tu', 'su', 'yo', 'me', 'te', 'le',
        'http', 'https', 'www', 'com'
    ]),
    messageLog: [],
    MAX_LOG_SIZE: 500,


    init(session) {
        if (this.initialized) return;
        this.initialized = true;

        this.session = session;

        Loader.loadCSS('./css/sections/trends.css');

        const { login, displayName, profile_image_url } = session;

        const titleEl = document.getElementById('tracker-title');
        if (titleEl) titleEl.textContent = Messages.Trends.title(displayName || login);

        if (profile_image_url) {
            const avatarEl = document.getElementById('tracker-avatar');
            const iconEl = document.getElementById('tracker-icon');
            if (avatarEl && iconEl) {
                avatarEl.src = profile_image_url;
                avatarEl.style.display = 'block';
                iconEl.style.display = 'none';
            }
        }

        const resetBtn = document.getElementById('reset-tracker-btn');
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());

        const startTimerBtn = document.getElementById('start-timer-btn');
        if (startTimerBtn) startTimerBtn.addEventListener('click', () => this.startTimer());

        this.render();
    },

    isConnected: false,

    connect() {
        if (this.isConnected) {
            return;
        }
        if (typeof window.tmi === 'undefined') {
            console.error("Trends: window.tmi is undefined!");
            this.updateStatus(false);
            return;
        }

        import('../utils/tmiService.js').then(({ TmiService }) => {
            TmiService.init(this.session.login).then(() => {
                this.updateStatus(true);
                this.isConnected = true;
            }).catch((e) => {
                console.error("Trends: TmiService Init Failed", e);
                this.updateStatus(false);
            });

            TmiService.addMessageListener((chn, tags, message) => {
                const username = tags.username;
                if (!username || CONFIG.IGNORED_BOTS.has(username.toLowerCase())) return;

                this.messageLog.unshift({
                    user: username,
                    text: message,
                    time: new Date()
                });
                if (this.messageLog.length > this.MAX_LOG_SIZE) this.messageLog.pop();

                this.processMessage(message);
            });
        });
    },

    timerInterval: null,
    isLocked: false,

    updateStatus(connected) {
        const el = document.getElementById('tracker-status');
        if (!el) return;
        if (connected) {
            el.innerHTML = Messages.Tracker.connected;
        } else {
            el.innerHTML = Messages.Tracker.error;
        }
    },

    startTimer() {
        this.connect();

        const input = document.getElementById('tracker-minutes');
        const display = document.getElementById('tracker-timer');
        const inputContainer = document.getElementById('tracker-input-container');

        this.isTracking = true;
        this.resetInternal();

        const minutes = parseInt(input?.value) || 5;

        if (inputContainer) inputContainer.classList.add('hidden');
        if (display) display.classList.remove('hidden');

        const seconds = minutes * 60;
        this.runTimer(seconds);
        this.render();

        UI.showToast(Messages.Tracker.started(minutes), 'success');
    },

    resetInternal() {
        this.wordCounts = {};
        this.messageLog = [];
    },

    runTimer(seconds) {
        let remaining = seconds;
        const display = document.getElementById('tracker-timer');
        const status = document.getElementById('tracker-status');

        if (display) {
            display.classList.remove('hidden');


            display.classList.remove('text-warning', 'text-accent');
            display.classList.add('text-primary');
        }

        if (status) status.classList.remove('hidden');

        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            remaining--;
            if (display) display.textContent = this.formatTime(remaining);

            if (remaining <= 0) {
                this.endTimer();
                UI.showToast(Messages.Tracker.finished, 'warning');
            }
        }, 1000);
    },

    endTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.isLocked = true;
        this.isTracking = false;

        const display = document.getElementById('tracker-timer');
        if (display) {


            display.classList.remove('text-primary');
            display.classList.add('text-warning');
        }

        const entries = Object.entries(this.wordCounts);
        if (entries.length > 0) {
            const sorted = entries.sort((a, b) => b[1] - a[1]);
            const [word, count] = sorted[0];
            UI.showToast(Messages.Tracker.winner(word, count), 'success');
        } else {
            UI.showToast(Messages.Tracker.finished, 'warning');
        }

        const firstRow = document.querySelector('#tracker-body tr:first-child');
        if (firstRow) {
            firstRow.classList.add('tracker-row-winner');

            const wordEl = firstRow.querySelector('.word-text');
            if (wordEl) wordEl.classList.add('gold-text');
        }
    },

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    },

    getMessagesByUser(username) {
        const target = username.toLowerCase();
        return this.messageLog.filter(m => m.user.toLowerCase() === target);
    },

    processMessage(msg) {
        const words = msg.toLowerCase().split(/\s+/);
        const firstWord = words[0];

        if (!firstWord) return;

        const cleanWord = firstWord.replace(/[^\wñáéíóúü]/g, '');

        if (cleanWord.length > 2 && !this.isIgnored.has(cleanWord)) {
            this.wordCounts[cleanWord] = (this.wordCounts[cleanWord] || 0) + 1;
        }

        this.render();
    },

    reset() {
        this.wordCounts = {};
        this.isLocked = false;
        if (this.timerInterval) clearInterval(this.timerInterval);

        const inputContainer = document.getElementById('tracker-input-container');
        const display = document.getElementById('tracker-timer');

        if (inputContainer) inputContainer.classList.remove('hidden');
        if (display) {


            display.classList.remove('text-primary', 'text-warning');
            display.classList.add('text-accent');
        }

        this.render();
    },

    renderPending: false,

    render() {
        if (this.renderPending) return;

        this.renderPending = true;
        requestAnimationFrame(() => {
            this._renderLogic();
            this.renderPending = false;
        });
    },

    _renderLogic() {
        const tbody = document.getElementById('tracker-body');
        if (!tbody) return;

        if (!this.isTracking) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center; padding:40px; color:var(--text-muted);">
                        <div style="font-size:2rem; margin-bottom:10px;"><i class="fa-solid fa-play"></i></div>
                        <h4 style="color:var(--text-primary); margin-bottom:5px;">Listo para analizar</h4>
                        <p>Presiona el botón <strong>Play</strong> para comenzar a contar palabras.</p>
                    </td>
                </tr>
            `;
            return;
        }

        const entries = Object.entries(this.wordCounts);

        if (entries.length === 0) {
            tbody.innerHTML = Messages.Tracker.waiting;
            return;
        }

        const sorted = entries
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const maxCount = sorted[0][1];

        tbody.innerHTML = sorted.map((item, index) => {
            const [word, count] = item;
            const percentage = (count / maxCount) * 100;
            const rankClass = index < 3 ? `rank-${index + 1}` : '';
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

            return `
                <tr class="fade-in ${rankClass}">
                    <td><span class="rank-medal">${medal}</span></td>
                    <td class="word-text" style="font-weight:600;">${word}</td>
                    <td class="count-text" style="text-align:right; font-size:1.1rem;">${count}</td>
                    <td>
                        <div class="progress-bg">
                            <div class="progress-fill" style="width:${percentage}%"></div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
};
