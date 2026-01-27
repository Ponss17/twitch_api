import { UI } from '../ui.js';
import { Messages } from '../utils/messages.js';
import { API_ENDPOINTS } from '../utils/constants.js';
import { cache, CACHE_TTL } from '../utils/cacheService.js';
import { Session, Clip } from '../types.js';

export const ClipsModule = {
    session: null as Session | null,
    initialized: false,
    allClips: [] as Clip[],
    currentClips: [] as Clip[],
    favorites: [] as string[],
    observer: null as IntersectionObserver | null,
    currentPage: 1,
    ITEMS_PER_PAGE: 20,

    async init(session: Session) {
        this.session = session;
        if (this.initialized) {
            this.loadClips();
            return;
        }

        import('../utils/loader.js').then(({ Loader }) => {
            Loader.loadCSS('css/sections/clips.css');
        });

        this.loadFavorites();

        this.observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target as HTMLImageElement;
                    img.src = img.dataset.src!;
                    img.classList.remove('lazy-img');
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '50px' });

        this.setupUI();
        this.initialized = true;
    },

    deactivate() {
        if (this.observer) {
            this.observer.disconnect();
        }
        console.log('[ClipsModule] Deactivated');
    },

    loadFavorites() {
        if (!this.session) return;
        try {
            const saved = localStorage.getItem(`clips_favs_${this.session.userId}`);
            this.favorites = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading favorites', e);
            this.favorites = [];
        }
    },

    saveFavorites() {
        if (!this.session) return;
        try {
            localStorage.setItem(`clips_favs_${this.session.userId}`, JSON.stringify(this.favorites));
        } catch (e) {
            console.error('Error saving favorites', e);
        }
    },

    toggleFavorite(clipId: string) {
        if (this.favorites.includes(clipId)) {
            this.favorites = this.favorites.filter((id: string) => id !== clipId);
            UI.showToast('Clip eliminado de favoritos', 'info');
        } else {
            this.favorites.push(clipId);
            UI.showToast('Clip añadido a favoritos', 'success');
        }
        this.saveFavorites();
        this.updateFavoriteBtn(clipId);
    },

    setupUI() {
        this.setupFilters();

        const refreshBtn = document.getElementById('refresh-clips-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadClips(true);
            });
        }
    },

    setupFilters() {
        const searchInput = document.getElementById('clips-search') as HTMLInputElement;
        const sortSelect = document.getElementById('clips-sort');

        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filterAndRender();
            }, 300));
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.filterAndRender();
            });
        }
    },

    debounce(func: Function, wait: number) {
        let timeout: NodeJS.Timeout;
        return function executedFunction(this: any, ...args: any[]) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    async loadClips(forceRefresh = false) {
        const container = document.getElementById('clips-gallery');
        if (!container) return;
        if (!this.session) return;

        const cacheKey = `clips_${this.session.userId}`;

        if (!forceRefresh) {
            const cachedClips = cache.get(cacheKey);
            if (cachedClips) {
                this.allClips = cachedClips;
                this.filterAndRender();
                return;
            }
        }

        this.renderSkeleton(container);
        if (forceRefresh) UI.showToast('Actualizando clips...', 'info');

        try {
            const { apiKey, token, login } = this.session;
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            let url = API_ENDPOINTS.CLIPS;

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                url += `?channel=${login}`;
            } else if (apiKey) {
                url += `?apiKey=${apiKey}&channel=${login}`;
            }

            const response = await fetch(url, { headers });

            if (!response.ok) {
                const isAuthError = response.status === 401 || response.status === 403;
                throw new Error(isAuthError ? 'auth_error' : 'fetch_error');
            }

            const data = await response.json();
            const clips = Array.isArray(data) ? data : (data.clips || data.data || []);

            this.allClips = clips;
            if (clips.length > 0) {
                cache.set(cacheKey, clips, CACHE_TTL);
            }

            this.filterAndRender();
        } catch (error) {
            this.handleError(error, container);
        }
    },

    handleError(error: unknown, container: HTMLElement) {
        const isAuthError = (error as Error).message === 'auth_error';
        UI.showToast(isAuthError ? Messages.Auth.expired : Messages.Clips.loadError, 'error');

        if (isAuthError) {
            container.innerHTML = `
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
            container.innerHTML = Messages.Common.error((error as Error).message);
            const retryBtn = document.getElementById('retry-clips-btn');
            if (retryBtn) retryBtn.onclick = () => this.loadClips();
        }
    },

    renderSkeleton(container: HTMLElement) {
        container.innerHTML = Array(8).fill(0).map(() => `
            <div class="skeleton-card">
                <div class="skeleton-thumb skeleton"></div>
                <div class="skeleton-info">
                    <div class="skeleton-title skeleton"></div>
                    <div class="skeleton-meta">
                        <div class="skeleton-text skeleton"></div>
                        <div class="skeleton-text skeleton"></div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    filterAndRender() {
        const searchTerm = (document.getElementById('clips-search') as HTMLInputElement)?.value.toLowerCase() || '';
        const sortValue = (document.getElementById('clips-sort') as HTMLSelectElement)?.value || 'date-desc';

        let filtered = this.allClips.filter((clip: any) =>
            clip.title.toLowerCase().includes(searchTerm)
        );

        filtered.sort((a: any, b: any) => {
            switch (sortValue) {
                case 'date-desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'date-asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'views-desc': return b.view_count - a.view_count;
                case 'views-asc': return a.view_count - b.view_count;
                default: return 0;
            }
        });

        this.currentClips = filtered;
        this.currentPage = 1;

        const clipsGallery = document.getElementById('clips-gallery');
        if (clipsGallery) clipsGallery.innerHTML = '';

        this.renderPage();
    },

    renderPage() {
        const clipsGallery = document.getElementById('clips-gallery');
        if (!clipsGallery) return;

        if (this.currentClips.length === 0) {
            clipsGallery.innerHTML = Messages.Clips.empty;
            return;
        }

        const loadMore = document.getElementById('clips-load-more');
        if (loadMore) loadMore.remove();

        const start = (this.currentPage - 1) * this.ITEMS_PER_PAGE;
        const end = start + this.ITEMS_PER_PAGE;
        const pageClips = this.currentClips.slice(start, end);

        const fragment = document.createDocumentFragment();

        pageClips.forEach((clip: Clip) => {
            fragment.appendChild(this.buildCard(clip));
        });

        clipsGallery.appendChild(fragment);

        if (end < this.currentClips.length) {
            this.addLoadMoreButton(clipsGallery);
        }
    },

    addLoadMoreButton(container: HTMLElement) {
        const btnContainer = document.createElement('div');
        btnContainer.id = 'clips-load-more';
        btnContainer.className = 'load-more-container';

        const btn = document.createElement('button');
        btn.className = 'btn-secondary';
        btn.innerHTML = 'Ver más clips';
        btn.onclick = () => {
            this.currentPage++;
            this.renderPage();
        };

        btnContainer.appendChild(btn);
        container.after(btnContainer);
    },

    buildCard(clip: Clip) {
        const card = document.createElement('div');
        card.className = 'clip-card fade-in';
        card.dataset.id = clip.id;

        const safeTitle = UI.escapeHTML(clip.title);
        const safeUrl = UI.escapeHTML(clip.url);
        const safeThumb = UI.escapeHTML(clip.thumbnail_url);

        const dateStr = new Date(clip.created_at).toLocaleDateString('es-ES', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        const viewsStr = clip.view_count.toLocaleString('es-ES');

        const isFav = this.favorites.includes(clip.id);
        const favIconClass = isFav ? 'fa-solid fa-star' : 'fa-regular fa-star';
        const favActiveClass = isFav ? 'active' : '';

        card.innerHTML = `
            <div class="clip-actions">
                <button class="btn-clip-action fav-btn ${favActiveClass}" title="Favorito" data-id="${clip.id}">
                    <i class="${favIconClass}"></i>
                </button>
                <button class="btn-clip-action copy-btn" title="Copiar enlace" data-url="${safeUrl}">
                    <i class="fa-solid fa-link"></i>
                </button>
            </div>
            <a href="${safeUrl}" target="_blank" class="clip-link">
                <div class="clip-thumb-wrapper">
                    <img data-src="${safeThumb}" class="clip-thumb lazy-img" alt="${safeTitle}" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiA5IiBzdHlsZT0iYmFja2dyb3VuZDojMjIyOyIvPgo=">
                </div>
                <div class="clip-info">
                    <div class="clip-title" title="${safeTitle}">${safeTitle}</div>
                    <div class="clip-meta">
                        <span><i class="fa-solid fa-eye"></i> ${viewsStr}</span>
                        <span>${dateStr}</span>
                    </div>
                </div>
            </a>
        `;

        const img = card.querySelector('img');
        if (this.observer && img) this.observer.observe(img);

        this.attachCardEvents(card, safeUrl, clip.id);

        return card;
    },

    attachCardEvents(card: HTMLElement, url: string, clipId: string) {
        card.querySelector('.copy-btn')!.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard.writeText(url).then(() => {
                const btn = e.currentTarget as HTMLElement;
                const icon = btn.querySelector('i')!;
                const originalClass = icon.className;

                icon.className = 'fa-solid fa-check';
                UI.showToast('Enlace copiado', 'success');

                setTimeout(() => {
                    icon.className = originalClass;
                }, 2000);
            });
        });

        card.querySelector('.fav-btn')!.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleFavorite(clipId);
        });
    },

    updateFavoriteBtn(clipId: string) {
        const card = document.querySelector(`.clip-card[data-id="${clipId}"]`);
        if (!card) return;

        const btn = card.querySelector('.fav-btn');
        if (!btn) return;
        const icon = btn.querySelector('i');
        const isFav = this.favorites.includes(clipId);

        if (isFav) {
            btn.classList.add('active');
            if (icon) icon.className = 'fa-solid fa-star';
        } else {
            btn.classList.remove('active');
            if (icon) icon.className = 'fa-regular fa-star';
        }
    }
};
