import { UI } from '../../ui.js';
import { Messages } from '../../utils/messages.js';
import { API_ENDPOINTS } from '../../utils/constants.js';
import { CONFIG } from '../../config.js';
import { TmiService } from '../../utils/tmiService.js';
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

    init(session: Session) {
        this.session = session;
        import('../../utils/loader.js').then(({ Loader }) => {
            Loader.loadCSS('css/sections/roulette.css');
        });
        this.setupUI();
    },

    setupUI() {
        this.canvas = document.getElementById('roulette-canvas') as HTMLCanvasElement;
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
        if (!this.session) return;
        TmiService.connect(this.session.login).then(() => {
            this.isConnected = true;
            TmiService.addListener('roulette', (channel: string, tags: any, message: string) => {
                if (this.isSpinning || !this.isOpen) return;
                const login = tags.username;
                if (CONFIG.IGNORED_BOTS.has(login.toLowerCase())) return;

                if (!this.chatters.some((u: RouletteUser) => u.user_login.toLowerCase() === login.toLowerCase())) {
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
        if (countDisplay) countDisplay.textContent = String(this.chatters.length);
        this.drawRouletteWheel();
    },

    loadChatters() {
    },

    spin() {
    },

    drawRouletteWheel() {
    },

    drawEmptyWheel() {
    }
};
