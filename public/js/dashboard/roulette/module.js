import { UI } from '../../ui.js';
import { Messages } from '../../utils/messages.js';
import { API_ENDPOINTS } from '../../utils/constants.js';
import { CONFIG } from '../../config.js';
import { TmiService } from '../../utils/tmiService.js';
export const RouletteModule = {
    session: null,
    chatters: [],
    canvas: null,
    ctx: null,
    colors: ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'],
    startAngle: 0,
    arc: 0,
    spinTimeout: null,
    spinAngleStart: 10,
    spinTime: 0,
    spinTimeTotal: 0,
    isSpinning: false,
    isOpen: false,
    isConnected: false,
    isInitialized: false,
    init(session) {
        this.session = session;
        if (!this.isInitialized) {
            import('../../utils/loader.js').then(({ Loader }) => {
                Loader.loadCSS('css/sections/roulette.css');
            });
            this.setupUI();
            this.isInitialized = true;
        }
    },
    setupUI() {
        this.canvas = document.getElementById('roulette-canvas');
        if (!this.canvas)
            return;
        this.ctx = this.canvas.getContext('2d');
        // Remove existing listeners if any (though isInitialized check prevents this, 
        // it's good practice to be safe or just rely on the flag)
        document.getElementById('btn-spin-roulette')?.addEventListener('click', () => this.spin());
        document.getElementById('toggle-roulette')?.addEventListener('click', () => this.toggleEntries());
        document.getElementById('btn-refresh-roulette')?.addEventListener('click', () => {
            this.loadChatters();
            UI.showToast(Messages.Roulette.updated, 'success');
        });
        document.getElementById('close-winner-display')?.addEventListener('click', () => {
            document.getElementById('roulette-winner-display')?.classList.add('hidden');
        });
        this.drawEmptyWheel();
    },
    toggleEntries() {
        this.isOpen = !this.isOpen;
        const btn = document.getElementById('toggle-roulette');
        if (btn) {
            btn.className = this.isOpen ? 'btn-icon btn-warning' : 'btn-icon btn-success';
            btn.innerHTML = this.isOpen ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
        }
        if (this.isOpen) {
            UI.showToast(Messages.Roulette.open);
            this.loadChatters();
            this.connectTmi();
        }
        else {
            UI.showToast(Messages.Roulette.closed, 'warning');
            TmiService.disconnect();
            this.isConnected = false;
        }
    },
    connectTmi() {
        if (this.isConnected)
            return;
        if (!this.session)
            return;
        TmiService.connect(this.session.login).then(() => {
            this.isConnected = true;
            TmiService.addListener('roulette', (channel, tags, message) => {
                if (this.isSpinning || !this.isOpen)
                    return;
                const login = tags.username;
                if (CONFIG.IGNORED_BOTS.has(login.toLowerCase()))
                    return;
                if (!this.chatters.some((u) => u.user_login.toLowerCase() === login.toLowerCase())) {
                    this.chatters.push({ user_login: login, user_name: tags['display-name'] || login });
                    this.updateUI();
                    this.pulseCounter();
                }
            });
        });
    },
    pulseCounter() {
        const countDisplay = document.getElementById('roulette-count');
        if (countDisplay) {
            countDisplay.classList.add('count-pulse');
            setTimeout(() => countDisplay.classList.remove('count-pulse'), 500);
        }
    },
    updateUI() {
        const countDisplay = document.getElementById('roulette-count');
        if (countDisplay)
            countDisplay.textContent = String(this.chatters.length);
        this.drawRouletteWheel();
    },
    loadChatters() {
        if (!this.session)
            return;
        const { apiKey, token, login, displayName } = this.session;
        // Ensure streamer is always in the list immediately
        const existing = new Set(this.chatters.map((u) => u.user_login));
        let added = 0;
        if (!existing.has(login)) {
            this.chatters.push({
                user_login: login,
                user_name: displayName || login
            });
            existing.add(login);
            added++;
        }
        if (added > 0) {
            this.updateUI();
        }
        const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
        fetch(`${API_ENDPOINTS.CHATTERS}?channel=${login}&${tokenParam}`)
            .then(res => res.json())
            .then((data) => {
            if (data && Array.isArray(data.chatters)) {
                // existing set needs to be updated or recreated because we might have added streamer above
                const currentChatters = new Set(this.chatters.map(u => u.user_login.toLowerCase()));
                let newAdded = 0;
                data.chatters.forEach((name) => {
                    const lowerName = name.toLowerCase();
                    if (!currentChatters.has(lowerName) && !CONFIG.IGNORED_BOTS.has(lowerName)) {
                        this.chatters.push({ user_login: name, user_name: name });
                        currentChatters.add(lowerName);
                        newAdded++;
                    }
                });
                if (newAdded > 0) {
                    this.updateUI();
                    this.pulseCounter();
                }
            }
        })
            .catch(err => {
            console.error('Error loading chatters:', err);
            UI.showToast('Error al cargar usuarios del chat', 'error');
        });
    },
    spin() {
        if (this.isSpinning || this.chatters.length === 0)
            return;
        this.isSpinning = true;
        this.spinAngleStart = Math.random() * 10 + 10;
        this.spinTime = 0;
        this.spinTimeTotal = Math.random() * 3000 + 4000;
        this.rotateWheel();
    },
    rotateWheel() {
        this.spinTime += 30;
        if (this.spinTime >= this.spinTimeTotal) {
            this.stopRotateWheel();
            return;
        }
        const spinAngle = this.spinAngleStart - this.easeOut(this.spinTime, 0, this.spinAngleStart, this.spinTimeTotal);
        this.startAngle += (spinAngle * Math.PI / 180);
        this.drawRouletteWheel();
        this.spinTimeout = setTimeout(() => this.rotateWheel(), 30);
    },
    stopRotateWheel() {
        if (this.spinTimeout)
            clearTimeout(this.spinTimeout);
        this.isSpinning = false;
        const degrees = this.startAngle * 180 / Math.PI + 90;
        const arcd = 360 / this.chatters.length;
        const index = Math.floor((360 - degrees % 360) / arcd);
        const winner = this.chatters[index];
        this.showWinner(winner);
    },
    easeOut(t, b, c, d) {
        const ts = (t /= d) * t;
        const tc = ts * t;
        return b + c * (tc + -3 * ts + 3 * t);
    },
    showWinner(winner) {
        const display = document.getElementById('roulette-winner-display');
        const nameEl = document.getElementById('winner-name');
        if (display && nameEl) {
            nameEl.textContent = winner.user_name;
            display.classList.remove('hidden');
            UI.showToast(`🏆 Ganador: ${winner.user_name}`);
        }
    },
    drawRouletteWheel() {
        if (!this.canvas || !this.ctx)
            return;
        const outsideRadius = 200;
        const textRadius = 160;
        const insideRadius = 50;
        this.ctx.clearRect(0, 0, 500, 500);
        const len = this.chatters.length;
        if (len === 0) {
            this.drawEmptyWheel();
            return;
        }
        this.arc = Math.PI * 2 / len;
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        for (let i = 0; i < len; i++) {
            const angle = this.startAngle + i * this.arc;
            this.ctx.fillStyle = this.colors[i % this.colors.length];
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, outsideRadius, angle, angle + this.arc, false);
            this.ctx.arc(cx, cy, insideRadius, angle + this.arc, angle, true);
            this.ctx.stroke();
            this.ctx.fill();
            this.ctx.save();
            this.ctx.shadowOffsetX = -1;
            this.ctx.shadowOffsetY = -1;
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = "white";
            this.ctx.font = 'bold 14px Poppins, sans-serif';
            this.ctx.translate(cx + Math.cos(angle + this.arc / 2) * textRadius, cy + Math.sin(angle + this.arc / 2) * textRadius);
            this.ctx.rotate(angle + this.arc / 2 + Math.PI / 2);
            const text = this.chatters[i].user_name;
            this.ctx.fillText(text, -this.ctx.measureText(text).width / 2, 0);
            this.ctx.restore();
        }
    },
    drawEmptyWheel() {
        if (!this.canvas || !this.ctx)
            return;
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        this.ctx.clearRect(0, 0, 500, 500);
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 200, 0, 2 * Math.PI);
        this.ctx.fillStyle = "#1f2937";
        this.ctx.fill();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "#374151";
        this.ctx.stroke();
        this.ctx.fillStyle = "#9ca3af";
        this.ctx.font = "bold 20px Poppins";
        this.ctx.textAlign = "center";
        this.ctx.fillText("Esperando", cx, cy - 10);
        this.ctx.fillText("Participantes...", cx, cy + 20);
    }
};
