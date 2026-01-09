export const Tracker = {
    client: null,
    wordCounts: {},
    isIgnored: new Set([
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
        'y', 'o', 'pero', 'si', 'no', 'en', 'de', 'del', 'a', 'al', 'con', 'para', 'por',
        'que', 'qué', 'es', 'son', 'se', 'mi', 'tu', 'su', 'yo', 'me', 'te', 'le',
        'http', 'https', 'www', 'com'
    ]),

    init(channel) {
        if (this.client) return;

        this.client = new tmi.Client({
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

    render() {
        const tbody = document.getElementById('tracker-body');
        if (!tbody) return;

        const sorted = Object.entries(this.wordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        if (sorted.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#666;">Esperando mensajes...</td></tr>';
            return;
        }

        const maxCount = sorted[0][1];

        tbody.innerHTML = sorted.map((item, index) => {
            const [word, count] = item;
            const percentage = (count / maxCount) * 100;
            const rankClass = index < 3 ? `rank-${index + 1}` : '';
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

            return `
                <tr class="fade-in">
                    <td style="font-weight:bold; color:var(--text-secondary);">${medal}</td>
                    <td style="font-weight:600; color:var(--text-primary);">${word}</td>
                    <td style="text-align:right; font-family:monospace; font-size:1.1rem;">${count}</td>
                    <td>
                        <div style="background:rgba(255,255,255,0.1); height:6px; border-radius:3px; overflow:hidden;">
                            <div style="width:${percentage}%; background:var(--accent-color); height:100%; transition: width 0.3s ease;"></div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
};
