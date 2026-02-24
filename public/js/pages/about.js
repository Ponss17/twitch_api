var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { HeaderComponent } from "../shared/components/header.js";
import { FooterComponent } from "../shared/components/footer.js";
HeaderComponent.render("main-header");
FooterComponent.render("main-footer");
const canvas = document.getElementById("sparks-canvas");
if (canvas) {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const particles = [];
    const resize = /* @__PURE__ */ __name(() => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }, "resize");
    window.addEventListener("resize", resize);
    resize();
    const _Particle = class _Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 1.2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 1;
        this.speedY = (Math.random() - 0.5) * 1;
        this.color = "#9146ff";
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
    };
    __name(_Particle, "Particle");
    let Particle = _Particle;
    window.addEventListener("mousemove", (e) => {
      for (let i = 0; i < 1; i++) {
        particles.push(new Particle(e.clientX, e.clientY));
      }
    });
    const animate = /* @__PURE__ */ __name(() => {
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
    }, "animate");
    animate();
  }
}
const btn = document.getElementById("copy-btn");
const toast = document.getElementById("toast-notif");
btn?.addEventListener("click", () => {
  navigator.clipboard.writeText("ponsschiquito").then(() => {
    if (toast) {
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 3e3);
    }
  });
});
const backBtn = document.querySelector(".nav-back-btn");
if (backBtn) {
  backBtn.addEventListener("click", (e) => {
    if (document.referrer && document.referrer.includes(window.location.hostname)) {
      e.preventDefault();
      window.history.back();
    }
  });
}
