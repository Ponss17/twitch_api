import { UI } from '../../ui.js';
import { Messages } from '../../utils/messages.js';
import { RouletteMessages } from './messages.js';
import { API_ENDPOINTS } from '../../utils/constants.js';
import { CONFIG } from '../../config.js';
import { TmiService, TmiTags } from '../../utils/tmiService.js';
import { Session, RouletteUser } from '../../types.js';

export const RouletteModule = {
    session: null as Session | null,
    chatters: [] as RouletteUser[],
    canvas: null as HTMLCanvasElement | null,
    ctx: null as CanvasRenderingContext2D | null,
    colors: ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'],
    startAngle: 0,
    arc: 0,
    spinTimeout: null as NodeJS.Timeout | null,
    spinAngleStart: 10,
    spinTime: 0,
    spinTimeTotal: 0,
    isSpinning: false,
    isOpen: false,
    isConnected: false,
    isInitialized: false,

    init(session: Session) {
        this.session = session;
        if (this.isInitialized) {
            this.updateUI();
            return;
        }
        import('../../utils/loader.js').then(({ Loader }) => {
            Loader.loadCSS('css/sections/roulette.css');
        });
        this.setupUI();
        this.isInitialized = true;
    },

    deactivate() {
        this.isOpen = false;
        if (this.spinTimeout) clearTimeout(this.spinTimeout);
        TmiService.removeListener('roulette');
        TmiService.disconnect();
        this.isConnected = false;
        this.isSpinning = false;
    },

    setupUI() {
        this.canvas = document.getElementById('roulette-canvas') as HTMLCanvasElement;
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        document.getElementById('btn-spin-roulette')?.addEventListener('click', () => this.spin());
        document
            .getElementById('toggle-roulette')
            ?.addEventListener('click', () => this.toggleEntries());
        document.getElementById('btn-refresh-roulette')?.addEventListener('click', () => {
            this.loadChatters();
            UI.showToast(RouletteMessages.updatedRaw, 'success', 'fa-check');
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
            btn.innerHTML = this.isOpen
                ? '<i class="fa-solid fa-pause"></i>'
                : '<i class="fa-solid fa-play"></i>';
        }

        if (this.isOpen) {
            UI.showToast(RouletteMessages.openRaw, 'success', 'fa-door-open');
            this.loadChatters();
            this.connectTmi();
        } else {
            UI.showToast(RouletteMessages.closedRaw, 'warning', 'fa-door-closed');
            TmiService.disconnect();
            this.isConnected = false;
        }
    },

    async connectTmi() {
        if (this.isConnected) return;
        if (!this.session) return;

        const auth = this.session.token
            ? {
                  username: this.session.login,
                  token: this.session.token
              }
            : undefined;

        try {
            await TmiService.connect(this.session.login, auth);
            this.isConnected = true;
            TmiService.addListener(
                'roulette',
                (_channel: string, tags: TmiTags, _message: string) => {
                    if (this.isSpinning || !this.isOpen) return;
                    const login = tags.username;
                    if (CONFIG.IGNORED_BOTS.has(login.toLowerCase())) return;

                    if (
                        !this.chatters.some(
                            (u: RouletteUser) => u.user_login.toLowerCase() === login.toLowerCase()
                        )
                    ) {
                        this.chatters.push({
                            user_login: login,
                            user_name: tags['display-name'] || login
                        });
                        this.updateUI();
                        this.pulseCounter();
                    }
                }
            );
        } catch (err: any) {
            console.error('Roulette TMI Error:', err);
            UI.showToast(Messages.Common.connectionError || 'Error connecting to chat', 'error');
            this.toggleEntries();
        }
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
        if (countDisplay) countDisplay.textContent = String(this.chatters.length);
        this.drawRouletteWheel();
    },

    loadChatters() {
        if (!this.session) return;
        const { apiKey, token, login, displayName } = this.session;
        const existing = new Set(this.chatters.map((u: RouletteUser) => u.user_login));
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
            .then((res) => res.json())
            .then((data: any) => {
                const chattersList = Array.isArray(data) ? data : data.chatters || [];

                if (Array.isArray(chattersList)) {
                    const currentChatters = new Set(
                        this.chatters.map((u) => u.user_login.toLowerCase())
                    );
                    let newAdded = 0;

                    chattersList.forEach((item: any) => {
                        const login = typeof item === 'string' ? item : item.user_login;
                        const name = typeof item === 'string' ? item : item.user_name;

                        if (!login) return;

                        const lowerLogin = login.toLowerCase();
                        if (
                            !currentChatters.has(lowerLogin) &&
                            !CONFIG.IGNORED_BOTS.has(lowerLogin)
                        ) {
                            this.chatters.push({ user_login: login, user_name: name });
                            currentChatters.add(lowerLogin);
                            newAdded++;
                        }
                    });

                    if (newAdded > 0) {
                        this.updateUI();
                        this.pulseCounter();
                    }
                }
            })
            .catch((err) => {
                console.error('Error loading chatters:', err);
                UI.showToast('Error al cargar usuarios del chat', 'error');
            });
    },

    spin() {
        if (this.isSpinning || this.chatters.length === 0) return;
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
        const spinAngle =
            this.spinAngleStart -
            this.easeOut(this.spinTime, 0, this.spinAngleStart, this.spinTimeTotal);
        this.startAngle += (spinAngle * Math.PI) / 180;
        this.drawRouletteWheel();
        this.spinTimeout = setTimeout(() => this.rotateWheel(), 30);
    },

    stopRotateWheel() {
        if (this.spinTimeout) clearTimeout(this.spinTimeout);
        this.isSpinning = false;

        const degrees = ((this.startAngle * 180) / Math.PI) % 360;
        const arcd = 360 / this.chatters.length;
        const index = Math.floor(((360 - ((degrees + 90) % 360)) % 360) / arcd);
        const winner = this.chatters[index % this.chatters.length];
        this.showWinner(winner);
    },

    easeOut(t: number, b: number, c: number, d: number) {
        const ts = (t /= d) * t;
        const tc = ts * t;
        return b + c * (tc + -3 * ts + 3 * t);
    },

    showWinner(winner: RouletteUser) {
        const display = document.getElementById('roulette-winner-display');
        const nameEl = document.getElementById('winner-name');
        if (display && nameEl) {
            nameEl.textContent = winner.user_name;
            display.classList.remove('hidden');

            UI.showToast(`Ganador: ${winner.user_name}`, 'success', 'fa-trophy');

            if (this.session && this.session.login) {
                TmiService.sendMessage(
                    this.session.login,
                    `🏆 ¡El ganador es @${winner.user_name}! ¡Felicidades! 🎉`
                );
            }
        }
    },

    drawRouletteWheel() {
        if (!this.canvas || !this.ctx) return;

        const outsideRadius = 200;
        const textRadius = 160;
        const insideRadius = 50;

        this.ctx.clearRect(0, 0, 500, 500);

        const len = this.chatters.length;
        if (len === 0) {
            this.drawEmptyWheel();
            return;
        }

        this.arc = (Math.PI * 2) / len;

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
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 14px Poppins, sans-serif';
            this.ctx.translate(
                cx + Math.cos(angle + this.arc / 2) * textRadius,
                cy + Math.sin(angle + this.arc / 2) * textRadius
            );
            this.ctx.rotate(angle + this.arc / 2 + Math.PI / 2);

            const text = this.chatters[i].user_name;
            this.ctx.fillText(text, -this.ctx.measureText(text).width / 2, 0);
            this.ctx.restore();
        }
    },

    drawEmptyWheel() {
        if (!this.canvas || !this.ctx) return;
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        this.ctx.clearRect(0, 0, 500, 500);

        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 200, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#1a1625';
        this.ctx.fill();
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#9146ff';
        this.ctx.stroke();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 22px Poppins, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#9146ff';
        this.ctx.fillText('Esperando', cx, cy - 10);
        this.ctx.fillText('Participantes...', cx, cy + 22);

        this.ctx.shadowBlur = 0;
    }
};
