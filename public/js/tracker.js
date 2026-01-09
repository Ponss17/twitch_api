export const Tracker = {
    client: null,
    wordCounts: {},
    isIgnored: new Set([
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
        'y', 'o', 'pero', 'si', 'no', 'en', 'de', 'del', 'a', 'al', 'con', 'para', 'por',
        'que', 'qué', 'es', 'son', 'se', 'mi', 'tu', 'su', 'yo', 'me', 'te', 'le',
        'http', 'https', 'www', 'com'
    ]),
    ignoredUsers: new Set([
        'nightbot', 'streamelements', 'fossabot', 'moobot', 'wizebot', 'soundalert', 'rainmaker'
    ]),

    init(channel, displayName, avatarUrl = null) {
        const titleEl = document.getElementById('tracker-title');
        if (titleEl) titleEl.textContent = `Chat de ${displayName || channel}`;

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
            console.error('TMI.js not loaded');
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

            this.processMessage(message);
        });

        const resetBtn = document.getElementById('reset-tracker-btn');
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
    },

    updateStatus(connected) {
        const el = document.getElementById('tracker-status');
        if (!el) return;
        if (connected) {
            el.innerHTML = '<span style="color:var(--success-color)"><i class="fa-solid fa-circle"></i> Conectado</span>';
        } else {
            el.innerHTML = '<span style="color:var(--warning-color)"><i class="fa-solid fa-xmark"></i> Error</span>';
        }
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
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#666;">Esperando mensajes...</td></tr>';
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
