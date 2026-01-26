import { UI } from '../ui.js';
import { Messages } from '../utils/messages.js';
import { API_ENDPOINTS } from '../utils/constants.js';
import { cache, CACHE_TTL } from '../utils/cacheService.js';

export const ClipsModule = {
    session: null,
    initialized: false,
    async init(session) {
        this.session = session;
        import('../utils/loader.js').then(({ Loader }) => {
            Loader.loadCSS('css/sections/clips.css');
        });
        this.setupUI();

        if (this.initialized) return;
        this.initialized = true;
    },

    setupUI() {
        this.loadClips();

        const refreshBtn = document.getElementById('refresh-clips-btn');
        if (refreshBtn) {
            const newBtn = refreshBtn.cloneNode(true);
            refreshBtn.parentNode.replaceChild(newBtn, refreshBtn);

            newBtn.addEventListener('click', () => {
                this.loadClips(true);
                UI.showToast('Actualizando clips...', 'info');
            });
        }
    },

    async loadClips(forceRefresh = false) {
        const container = document.getElementById('clips-container');
        if (!container) return;

        const cacheKey = `clips_${this.session.userId}`;

        if (!forceRefresh) {
            const cachedClips = cache.get(cacheKey);
            if (cachedClips) {
                this.renderClips(cachedClips, container);
                return;
            }
        }

        container.innerHTML = Messages.Clips.loading;

        try {
            const { apiKey, token, login } = this.session;
            const headers = { 'Content-Type': 'application/json' };
            let url = API_ENDPOINTS.CLIPS;

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                url += `?channel=${login}`;
            } else if (apiKey) {
                url += `?apiKey=${apiKey}&channel=${login}`;
            }

            if (forceRefresh) {
                UI.showToast('Actualizando clips...', 'info');
            }

            const response = await fetch(url, { headers });

            if (!response.ok) {
                const isAuthError = response.status === 401 || response.status === 403;
                throw new Error(isAuthError ? 'auth_error' : 'fetch_error');
            }

            const data = await response.json();
            const clips = data.clips || [];

            cache.set(cacheKey, clips, CACHE_TTL.CLIPS);

            this.renderClips(clips, container);
        } catch (error) {
            const isAuthError = error.message === 'auth_error';
            UI.showToast(isAuthError ? Messages.Auth.expired : Messages.Clips.loadError, 'error');

            const clipsGallery = document.getElementById('clips-gallery');
            if (isAuthError) {
                clipsGallery.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                        <h3>${Messages.Auth.expiredTitle}</h3>
                        <p>${Messages.Auth.expiredMsg}</p>
                        <button id="relogin-clips-btn" class="btn-primary" style="margin-top:10px;">
                            ${Messages.Auth.reloginBtn}
                        </button>
                    </div>
                `;
                document.getElementById('relogin-clips-btn')?.addEventListener('click', () => {
                    import('../auth.js').then(m => m.Auth.relogin());
                });
            } else {
                clipsGallery.innerHTML = Messages.Common.error(error.message);
                const retryBtn = document.getElementById('retry-clips-btn');
                if (retryBtn) retryBtn.onclick = () => this.loadClips();
            }

            UI.showToast(isAuthError ? Messages.Auth.expired : Messages.Clips.loadError, 'error');
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
