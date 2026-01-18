import { Loader } from '../utils/loader.js';
import { UI } from '../ui.js';
import { Messages } from '../utils/messages.js';
import { CONFIG } from '../config.js';

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
    client: null,

    init(session) {
        if (this.initialized) return;
        this.initialized = true;

        this.session = session;


        Loader.loadCSS('./css/sections/roulette.css');

        this.canvas = document.getElementById('roulette-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');

            const spinBtn = document.getElementById('btn-spin-roulette');
            if (spinBtn) spinBtn.addEventListener('click', () => this.spin());

            const toggleBtn = document.getElementById('toggle-roulette');
            if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggleEntries());

            const refreshBtn = document.getElementById('btn-refresh-roulette');
            if (refreshBtn) refreshBtn.addEventListener('click', () => {
                this.loadChatters();
                UI.showToast(Messages.Roulette.updated, 'success');
            });

            this.drawEmptyWheel();

            const closeWinnerBtn = document.getElementById('close-winner-display');
            if (closeWinnerBtn) {
                closeWinnerBtn.addEventListener('click', () => {
                    const display = document.getElementById('roulette-winner-display');
                    if (display) display.classList.add('hidden');
                });
            }
        }
    },

    isOpen: false,

    toggleEntries() {
        this.isOpen = !this.isOpen;

        const btn = document.getElementById('toggle-roulette');
        if (btn) {
            btn.className = this.isOpen ? 'btn-icon btn-warning' : 'btn-icon btn-success';
            btn.innerHTML = this.isOpen ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
            btn.title = this.isOpen ? 'Cerrar Inscripciones' : 'Abrir Inscripciones';
        }

        if (this.isOpen) {
            UI.showToast(Messages.Roulette.open);
            this.loadChatters();
        } else {
            UI.showToast(Messages.Roulette.closed, 'warning');
        }
    },

    connectTmi() {
        if (this.isConnected) return;
        if (typeof window.tmi === 'undefined') return;

        import('../utils/tmiService.js').then(({ TmiService }) => {
            TmiService.init(this.session.login).then(() => {
                this.isConnected = true;
            });

            TmiService.addMessageListener((channel, tags, message) => {
                if (this.isSpinning) return;

                if (!this.isOpen) return;

                const login = tags.username;
                const name = tags['display-name'] || login;

                if (CONFIG.IGNORED_BOTS.has(login.toLowerCase())) return;

                const exists = this.chatters.some(u => u.user_login.toLowerCase() === login.toLowerCase());

                if (!exists) {
                    this.chatters.push({
                        user_login: login,
                        user_name: name
                    });

                    this.updateUI();

                    const countDisplay = document.getElementById('roulette-count');
                    if (countDisplay) {
                        countDisplay.style.color = '#3b82f6';
                        countDisplay.style.transform = 'scale(1.2)';
                        countDisplay.style.transition = 'all 0.2s';
                        setTimeout(() => {
                            countDisplay.style.color = '';
                            countDisplay.style.transform = '';
                        }, 500);
                    }
                }
            });
        });
    },

    updateUI() {
        const countDisplay = document.getElementById('roulette-count');
        if (countDisplay) countDisplay.textContent = this.chatters.length;
        this.drawRouletteWheel();
    },

    async loadChatters() {
        if (!this.isConnected) this.connectTmi();

        const countDisplay = document.getElementById('roulette-count');
        try {
            const { apiKey, login } = this.session;
            const res = await fetch(`/api/twitch/chatters?channel=${login}&apiKey=${apiKey}`);

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
        if (!this.canvas) return;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const outsideRadius = centerX - 10;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = "rgba(255,255,255,0.1)";
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, outsideRadius, 0, 2 * Math.PI);
        this.ctx.stroke();

        this.ctx.fillStyle = "rgba(255,255,255,0.5)";
        this.ctx.font = 'bold 20px "Outfit", sans-serif';
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        const text = this.isOpen
            ? Messages.Roulette.emptyWheel
            : "Dale al Play ▶️ para abrir";

        this.ctx.fillText(text, centerX, centerY);
    },

    drawRouletteWheel() {
        if (!this.canvas || this.chatters.length === 0) return;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const outsideRadius = centerX - 10;
        const textRadius = centerX * 0.6;
        const insideRadius = 0;

        this.arc = Math.PI * 2 / this.chatters.length;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.font = 'bold 13px "Outfit", sans-serif';
        this.ctx.textBaseline = "middle";

        const modalWinner = document.getElementById('roulette-winner-display');
        if (this.isSpinning && modalWinner) modalWinner.classList.add('hidden');

        for (let i = 0; i < this.chatters.length; i++) {
            const angle = this.startAngle + i * this.arc;
            this.ctx.fillStyle = this.colors[i % this.colors.length];

            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, outsideRadius, angle, angle + this.arc, false);
            this.ctx.arc(centerX, centerY, insideRadius, angle + this.arc, angle, true);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.save();

            this.ctx.shadowColor = "rgba(0,0,0,0.8)";
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetX = 1;
            this.ctx.shadowOffsetY = 1;
            this.ctx.fillStyle = "white";

            this.ctx.translate(centerX + Math.cos(angle + this.arc / 2) * textRadius,
                centerY + Math.sin(angle + this.arc / 2) * textRadius);
            this.ctx.rotate(angle + this.arc / 2);

            const text = this.chatters[i].user_name;
            const displayTex = text.length > 14 ? text.substring(0, 12) + '..' : text;
            this.ctx.textAlign = "right";
            this.ctx.fillText(displayTex, 0, 0);
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
        clearTimeout(this.spinTimeout);
        this.isSpinning = false;

        const degrees = this.startAngle * 180 / Math.PI + 90;
        const arcd = this.arc * 180 / Math.PI;
        const index = Math.floor((360 - degrees % 360) / arcd);

        let validIndex = index;
        if (validIndex >= this.chatters.length) validIndex = validIndex % this.chatters.length;
        if (validIndex < 0) validIndex = this.chatters.length + validIndex;


        this.ctx.save();
        this.ctx.font = 'bold 30px Helvetica, Arial';
        const text = this.chatters[validIndex].user_name;
        this.ctx.restore();

        this.showWinner(this.chatters[validIndex]);
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
            const { apiKey, login } = this.session;
            const message = `🎉 ¡El ganador de la ruleta es @${winnerName} ! 🎉`;

            await fetch('/api/twitch/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey,
                    message
                })
            });
        } catch (e) {
            console.error('Error anunciando ganador:', e);
        }
    },

    easeOut(t, b, c, d) {
        const ts = (t /= d) * t;
        const tc = ts * t;
        return b + c * (tc + -3 * ts + 3 * t);
    }
};
