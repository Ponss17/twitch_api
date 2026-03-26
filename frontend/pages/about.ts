import { HeaderComponent } from '../shared/components/header.js';
import { FooterComponent } from '../shared/components/footer.js';
import { injectSpeedInsights } from '@vercel/speed-insights';

injectSpeedInsights({
    debug: false,
    scriptSrc: '/_vercel/speed-insights/script.js'
});

HeaderComponent.render('main-header');
FooterComponent.render('main-footer');

const canvas = document.getElementById('sparks-canvas') as HTMLCanvasElement | null;
if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const particles: Particle[] = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            color: string;
            life: number;

            constructor(x: number, y: number) {
                this.x = x;
                this.y = y;
                this.size = Math.random() * 1.2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 1;
                this.speedY = (Math.random() - 0.5) * 1;
                this.color = '#9146ff';
                this.life = 1;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.life -= 0.035;
                if (this.size > 0.1) this.size -= 0.01;
            }
            draw() {
                if (!ctx) return;
                ctx.globalAlpha = this.life;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        let animating = false;

        const animate = () => {
            if (particles.length === 0) {
                animating = false;
                return;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                if (particles[i].life <= 0) {
                    particles.splice(i, 1);
                    i--;
                }
            }
            requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', (e) => {
            particles.push(new Particle(e.clientX, e.clientY));
            if (!animating) {
                animating = true;
                requestAnimationFrame(animate);
            }
        });
    }
}

const btn = document.getElementById('copy-btn');
const toast = document.getElementById('toast-notif');
btn?.addEventListener('click', () => {
    navigator.clipboard.writeText('ponsschiquito').then(() => {
        if (toast) {
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    });
});

const backBtn = document.querySelector('.nav-back-btn');
if (backBtn) {
    backBtn.addEventListener('click', (e) => {
        if (document.referrer && document.referrer.includes(window.location.hostname)) {
            e.preventDefault();
            window.history.back();
        }
    });
}
