export const UI = {
    escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.innerHTML = message;
        toast.className = `toast ${type === 'error' ? 'error' : ''}`;
        if (type === 'error') toast.style.background = "var(--warning-color)";
        else toast.style.background = "";

        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    },

    setupClipboard() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.copy-btn');
            if (!btn) return;

            const targetId = btn.dataset.target;
            const target = document.getElementById(targetId);

            if (target) {
                const valueToCopy = target.dataset.realValue || target.value;
                target.select();
                navigator.clipboard.writeText(valueToCopy).then(() => {
                    this.showToast('<i class="fa-solid fa-check"></i> Copiado');
                }).catch(() => {
                    this.showToast('<i class="fa-solid fa-xmark"></i> Error al copiar', 'error');
                });
            }
        });
    },

    setupHeroAnimation(heroCodeDisplay) {
        if (!heroCodeDisplay) return;

        const scenes = [
            `
            <div class="code-line"><span class="c-purple">const</span> <span class="c-blue">streamer</span> = <span class="c-green">"LosPerris"</span>;</div>
            <div class="code-line"><span class="c-purple">await</span> api.checkFollow(<span class="c-blue">user</span>);</div>
            <div class="code-result">// ⏳ Tiempo seguido:</div>
            <div class="code-output">"2 años, 3 meses y 1 día"</div>
            `,
            `
            <div class="code-line"><span class="c-purple">const</span> <span class="c-blue">streamer</span> = <span class="c-green">"LosPerris"</span>;</div>
            <div class="code-line"><span class="c-purple">await</span> api.createClip();</div>
            <div class="code-result">// 🎬 Clip generado:</div>
            <div class="code-output">"twitch.tv/LosPerris/clip..."</div>
            `
        ];

        let currentScene = 0;

        setInterval(() => {
            heroCodeDisplay.classList.add('fade-out');

            setTimeout(() => {
                currentScene = (currentScene + 1) % scenes.length;
                heroCodeDisplay.innerHTML = scenes[currentScene];
                heroCodeDisplay.classList.remove('fade-out');
            }, 500);

        }, 7000);
    },

};
