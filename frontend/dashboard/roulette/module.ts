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

    init(session) {
        this.session = session;
        import('../../utils/loader.js').then(({ Loader }) => {
            Loader.loadCSS('css/sections/roulette.css');
        });
        this.setupUI();
    },

    setupUI() {
        this.canvas = document.getElementById('roulette-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

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
        } else {
            UI.showToast(Messages.Roulette.closed, 'warning');
            TmiService.disconnect();
            this.isConnected = false;
        }
    },

    connectTmi() {
        if (this.isConnected) return;
        TmiService.connect(this.session.login).then(() => {
            this.isConnected = true;
            TmiService.addListener('roulette', (channel, tags, message) => {
                if (this.isSpinning || !this.isOpen) return;
                const login = tags.username;
                if (CONFIG.IGNORED_BOTS.has(login.toLowerCase())) return;

                if (!this.chatters.some(u => u.user_login.toLowerCase() === login.toLowerCase())) {
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
        if (countDisplay) countDisplay.textContent = this.chatters.length;
        this.drawRouletteWheel();
    },

    async loadChatters() {
        try {
            const { apiKey, login } = this.session;
            const res = await fetch(`${API_ENDPOINTS.CHATTERS}?channel=${login}&apiKey=${apiKey}`);
            if (res.ok) {
                const data = await res.json();
                const apiChatters = data.filter(u => !CONFIG.IGNORED_BOTS.has(u.user_login.toLowerCase()));
                const chatterMap = new Map();
                this.chatters.forEach(c => chatterMap.set(c.user_login.toLowerCase(), c));
                apiChatters.forEach(c => chatterMap.set(c.user_login.toLowerCase(), c));
                this.chatters = Array.from(chatterMap.values());
                this.updateUI();
                if (this.chatters.length === 0) this.drawEmptyWheel();
            }
        } catch (e) {
            console.error('Error loading chatters', e);
        }
    },

    drawEmptyWheel() {
        if (!this.ctx) return;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = "rgba(255,255,255,0.1)";
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, centerX - 10, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.fillStyle = "rgba(255,255,255,0.5)";
        this.ctx.font = 'bold 20px "Outfit", sans-serif';
        this.ctx.textAlign = "center";
        this.ctx.fillText(this.isOpen ? Messages.Roulette.emptyWheel : Messages.Roulette.playToOpen, centerX, centerY);
    },

    drawRouletteWheel() {
        if (!this.ctx || this.chatters.length === 0) return;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const outsideRadius = centerX - 10;
        const textRadius = centerX * 0.6;
        this.arc = Math.PI * 2 / this.chatters.length;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = 'bold 13px "Outfit", sans-serif';

        for (let i = 0; i < this.chatters.length; i++) {
            const angle = this.startAngle + i * this.arc;
            this.ctx.fillStyle = this.colors[i % this.colors.length];
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, outsideRadius, angle, angle + this.arc, false);
            this.ctx.arc(centerX, centerY, 0, angle + this.arc, angle, true);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.save();
            this.ctx.fillStyle = "white";
            this.ctx.translate(centerX + Math.cos(angle + this.arc / 2) * textRadius, centerY + Math.sin(angle + this.arc / 2) * textRadius);
            this.ctx.rotate(angle + this.arc / 2);
            const name = this.chatters[i].user_name;
            this.ctx.textAlign = "right";
            this.ctx.fillText(name.length > 14 ? name.substring(0, 12) + '..' : name, 0, 0);
            this.ctx.restore();
        }
    },

    spin() {
        if (this.isSpinning) return;
        if (this.chatters.length === 0) {
            UI.showToast(Messages.Roulette.noParticipants, "warning");
            return;
        }
        this.isSpinning = true;
        this.spinAngleStart = Math.random() * 10 + 10;
        this.spinTime = 0;
        this.spinTimeTotal = Math.random() * 3000 + 4000;
        this.rotateWheel();
    },

    easeOut(t, b, c, d) {
        const ts = (t /= d) * t;
        const tc = ts * t;
        return b + c * (tc + -3 * ts + 3 * t);
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
        this.isSpinning = false;
        const degrees = this.startAngle * 180 / Math.PI + 90;
        const arcd = this.arc * 180 / Math.PI;
        const index = Math.floor((360 - degrees % 360) / arcd) % this.chatters.length;
        const winner = this.chatters[index < 0 ? this.chatters.length + index : index];
        this.showWinner(winner);
    },

    showWinner(user) {
        const display = document.getElementById('roulette-winner-display');
        const name = document.getElementById('winner-name');
        if (display && name) {
            name.textContent = user.user_name;
            display.classList.remove('hidden');
            UI.showToast(Messages.Roulette.winner(user.user_name));
            this.announceWinner(user.user_name);
        }
    },

    async announceWinner(winnerName) {
        try {
            await fetch(API_ENDPOINTS.SEND_MESSAGE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: this.session.apiKey, message: `🎉 ¡El ganador de la ruleta es @${winnerName} ! 🎉` })
            });
        } catch (e) { }
    }
};
