import { Loader } from '../utils/loader.js';
import { UI } from '../ui.js';

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
        this.session = session;
        console.log('[RouletteModule] Init Visual + Realtime');

        Loader.loadCSS('./css/sections/roulette.css');

        this.canvas = document.getElementById('roulette-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.loadChatters();

            const spinBtn = document.getElementById('btn-spin-roulette');
            if (spinBtn) spinBtn.addEventListener('click', () => this.spin());

            const refreshBtn = document.getElementById('btn-refresh-roulette');
            if (refreshBtn) refreshBtn.addEventListener('click', () => {
                this.loadChatters();
                UI.showToast('Lista actualizada', 'success');
            });
        }

        this.connectTmi();
    },

    connectTmi() {
        if (this.client) return;
        if (typeof window.tmi === 'undefined') return;

        console.log('[Roulette] Connecting to chat...');
        this.client = new window.tmi.Client({
            channels: [this.session.login],
            connection: { secure: true, reconnect: true }
        });

        this.client.connect().catch(console.error);

        this.client.on('message', (channel, tags, message, self) => {
            if (this.isSpinning) return;

            const login = tags.username;
            const name = tags['display-name'] || login;

            const ignored = new Set(['nightbot', 'streamelements', 'fossabot', 'moobot', 'wizebot', 'soundalert', 'rainmaker', 'botrixoficial', 'trackerggbot']);
            if (ignored.has(login.toLowerCase())) return;

            const exists = this.chatters.some(u => u.user_login.toLowerCase() === login.toLowerCase());

            if (!exists) {
                console.log(`[Roulette] New chatter detected via TMI: ${name}`);
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
    },

    updateUI() {
        const countDisplay = document.getElementById('roulette-count');
        if (countDisplay) countDisplay.textContent = this.chatters.length;
        this.drawRouletteWheel();
    },

    async loadChatters() {
        const countDisplay = document.getElementById('roulette-count');
        try {
            const { apiKey, login } = this.session;
            const res = await fetch(`api/chatters?channel=${login}&apiKey=${apiKey}`);

            if (res.ok) {
                const data = await res.json();

                const ignored = new Set(['nightbot', 'streamelements', 'fossabot', 'moobot', 'wizebot', 'soundalert', 'rainmaker', 'botrixoficial', 'trackerggbot']);

                const apiChatters = data.filter(u => !ignored.has(u.user_login.toLowerCase()));

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
        this.ctx.fillText("Sin participantes", centerX, centerY);
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
            UI.showToast("No hay participantes", "warning");
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
            UI.showToast(`¡Ganador: ${user.user_name}!`);
        }
    },

    easeOut(t, b, c, d) {
        const ts = (t /= d) * t;
        const tc = ts * t;
        return b + c * (tc + -3 * ts + 3 * t);
    }
};
