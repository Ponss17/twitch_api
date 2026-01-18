import { UI } from '../ui.js';
import { Messages } from '../utils/messages.js';
import { Loader } from '../utils/loader.js';

export const ClipsModule = {
    session: null,

    async init(session) {
        if (this.initialized) return;
        this.initialized = true;

        await Loader.loadCSS('css/sections/clips.css');

        this.session = session;
        this.loadClips();
    },

    async loadClips() {
        const clipsGallery = document.getElementById('clips-gallery');
        if (!clipsGallery) return;

        clipsGallery.innerHTML = Messages.Clips.loading;

        const { login, apiKey, token } = this.session;

        try {
            const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
            const res = await fetch(`/api/twitch/get-clips?channel=${login}&limit=20&${tokenParam}`);

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();
            this.renderClips(data);
        } catch (error) {
            clipsGallery.innerHTML = Messages.Common.error(error.message);
            const retryBtn = document.getElementById('retry-clips-btn');
            if (retryBtn) retryBtn.onclick = () => this.loadClips();

            UI.showToast(Messages.Clips.loadError, 'error');
        }
    },

    renderClips(clips) {
        const clipsGallery = document.getElementById('clips-gallery');

        if (!clips || clips.length === 0) {
            clipsGallery.innerHTML = Messages.Clips.empty;
            return;
        }

        clipsGallery.innerHTML = '';
        const fragment = document.createDocumentFragment();

        clips.forEach(clip => {
            const card = document.createElement('div');
            card.className = 'clip-card';

            const safeTitle = UI.escapeHTML(clip.title);
            const safeUrl = UI.escapeHTML(clip.url);
            const safeThumb = UI.escapeHTML(clip.thumbnail_url);

            const dateStr = new Date(clip.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            const viewsStr = clip.view_count.toLocaleString('es-ES');

            card.innerHTML = `
                <a href="${safeUrl}" target="_blank" class="clip-link">
                    <img src="${safeThumb}" class="clip-thumb" alt="${safeTitle}" loading="lazy">
                    <div class="clip-info">
                        <div class="clip-title" title="${safeTitle}">${safeTitle}</div>
                        <div class="clip-meta">
                            <span><i class="fa-solid fa-eye"></i> ${viewsStr}</span>
                            <span>${dateStr}</span>
                        </div>
                    </div>
                </a>
            `;
            fragment.appendChild(card);
        });

        clipsGallery.appendChild(fragment);
    }
};
