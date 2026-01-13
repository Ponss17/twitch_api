import { Messages } from '../utils/messages.js';

export const TrendsModule = {
    client: null,
    wordCounts: {},
    isIgnored: new Set([
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
        'y', 'o', 'pero', 'si', 'no', 'en', 'de', 'del', 'a', 'al', 'con', 'para', 'por',
        'que', 'qué', 'es', 'son', 'se', 'mi', 'tu', 'su', 'yo', 'me', 'te', 'le',
        'http', 'https', 'www', 'com'
    ]),
    ignoredUsers: new Set([
        'nightbot', 'streamelements', 'fossabot', 'moobot', 'wizebot', 'soundalert', 'rainmaker', 'botrixoficial', 'trackerggbot'
    ]),
    messageLog: [],
    MAX_LOG_SIZE: 500,


    init(channel, displayName, avatarUrl = null) {
        Loader.loadCSS('css/sections/trends.css');
        this.session = { login: channel, displayName };

        const titleEl = document.getElementById('tracker-title');
        if (titleEl) titleEl.textContent = `Tendencias de ${displayName || channel}`;

        if (avatarUrl) {
            const avatarEl = document.getElementById('tracker-avatar');
            const iconEl = document.getElementById('tracker-icon');
            if (avatarEl && iconEl) {
                avatarEl.src = avatarUrl;
                avatarEl.style.display = 'block';
                iconEl.style.display = 'none';
            }
        }

        if (this.client) return;

        if (typeof window.tmi === 'undefined') {
            this.updateStatus(false);
            return;
        }

        this.client = new window.tmi.Client({
            channels: [channel],
            connection: { secure: true, reconnect: true }
        });

        this.client.connect().then(() => {
            this.updateStatus(true);
        }).catch(err => {
            console.error(err);
            this.updateStatus(false);
        });

        this.client.on('message', (chn, tags, message, self) => {
            if (self) return;
            if (tags.username && this.ignoredUsers.has(tags.username.toLowerCase())) return;

            this.messageLog.unshift({
                user: tags.username,
                text: message,
                time: new Date()
            });
            if (this.messageLog.length > this.MAX_LOG_SIZE) this.messageLog.pop();

            this.processMessage(message);
        });

        const resetBtn = document.getElementById('reset-tracker-btn');
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());

        const startTimerBtn = document.getElementById('start-timer-btn');
        if (startTimerBtn) startTimerBtn.addEventListener('click', () => this.startTimer());
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
        const input = document.getElementById('tracker-minutes');
        const display = document.getElementById('tracker-timer');
        const controls = document.querySelector('.timer-controls');
        const minutes = parseInt(input.value);

        if (!minutes || minutes <= 0) return;

        this.reset();
        this.isLocked = false;

        let seconds = minutes * 60;

        if (controls) controls.style.display = 'none';
        if (display) {
            display.classList.remove('hidden');
            display.textContent = this.formatTime(seconds);
        }

        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            seconds--;
            if (display) display.textContent = this.formatTime(seconds);

            if (seconds <= 0) {
                this.endTimer();
            }
        }, 1000);
    },

    endTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.isLocked = true;

        const display = document.getElementById('tracker-timer');
        if (display) {
            display.textContent = Messages.Tracker.timeUp;
            display.style.color = "var(--warning)";
        }

        const firstRow = document.querySelector('#tracker-body tr:first-child');
        if (firstRow) {
            firstRow.style.background = "linear-gradient(90deg, rgba(255,215,0,0.2), transparent)";
            firstRow.style.borderLeft = "4px solid #FFD700";
            firstRow.style.transform = "scale(1.02)";
            firstRow.querySelector('.word-text').style.color = "#FFD700";
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

        words.forEach(word => {
            const cleanWord = word.replace(/[^\wñáéíóúü]/g, '');

            if (cleanWord.length > 2 && !this.isIgnored.has(cleanWord)) {
                this.wordCounts[cleanWord] = (this.wordCounts[cleanWord] || 0) + 1;
            }
        });

        this.render();
    },

    reset() {
        this.wordCounts = {};
        this.isLocked = false;
        if (this.timerInterval) clearInterval(this.timerInterval);

        const controls = document.querySelector('.timer-controls');
        const display = document.getElementById('tracker-timer');

        if (controls) controls.style.display = 'flex';
        if (display) {
            display.classList.add('hidden');
            display.style.color = "var(--accent)";
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
