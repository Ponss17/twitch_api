import { UI } from '../../core/ui-core.js';
import { Messages } from '../../shared/messages/messages.js';
import { ClipsMessages } from './clips/messages.js';
import { AuthMessages } from '../../shared/messages/authMessages.js';
import { DASHBOARD_CONFIG } from './dashboard-config.js';
const { API_ENDPOINTS } = DASHBOARD_CONFIG;
import { cache, CACHE_TTL } from '../../services/cacheService.js';
import { Session, Clip, DashboardModule } from '../../types.js';
import { dashboardStore, ClipsActions, Clip as StoreClip } from '../../core/dashboardStore.js';
import { BaseModule } from '../../shared/utils/baseModule.js';

interface IClipsModule extends DashboardModule {
    observer: IntersectionObserver | null;
    cssLoaded: boolean;
    unsubscribers: Array<() => void>;
    setupStoreSubscriptions(): void;
    buildCard(clip: StoreClip): HTMLElement;
    attachCardEvents(card: HTMLElement, url: string, clipId: string): void;
}

export const ClipsModule: IClipsModule = {
    ...BaseModule,
    session: null,
    initialized: false,
    observer: null,
    cssLoaded: false,
    uiInitialized: false,
    unsubscribers: [],

    init(session: Session): void {
        this.initBase(session, 'css/sections/clips.css');

        if (session.userId) {
            ClipsActions.loadFavorites(session.userId);
        }

        if (!this.observer) {
            this.observer = new IntersectionObserver(
                (entries, observer) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            const img = entry.target as HTMLImageElement;
                            if (img.dataset.src) {
                                img.src = img.dataset.src;
                                img.classList.remove('lazy-img');
                                observer.unobserve(img);
                            }
                        }
                    });
                },
                { rootMargin: '50px' }
            );
        }
    },

    activate() {
        if (!this.uiInitialized) {
            this.setupUI();
            this.setupStoreSubscriptions();
            this.uiInitialized = true;
        }

        // Cargar clips si el store está vacío
        const state = dashboardStore.getState().clips;
        if (state.clips.length === 0 && !state.isLoading) {
            this.loadClips();
        }
    },

    deactivate() {
        if (this.observer) {
            this.observer.disconnect();
        }
        // Limpiar suscripciones al store
        this.unsubscribers.forEach((unsub) => unsub());
        this.unsubscribers = [];
    },

    setupStoreSubscriptions(): void {
        // Suscribirse a cambios en el estado de clips
        this.unsubscribers.push(
            dashboardStore.on('clips', (state) => {
                this.render(state.clips);
            })
        );
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
            searchInput.addEventListener(
                'input',
                this.debounce(() => {
                    ClipsActions.setSearchTerm(searchInput.value.toLowerCase());
                }, 300)
            );
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                ClipsActions.setSortValue((sortSelect as HTMLSelectElement).value);
            });
        }
    },

    debounce<T extends (...args: unknown[]) => void>(func: T, wait: number) {
        let timeout: ReturnType<typeof setTimeout>;
        return (...args: Parameters<T>) => {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    async loadClips(forceRefresh = false) {
        if (!this.session) return;

        const cacheKey = `clips_${this.session.userId}`;

        // Verificar cache primero
        if (!forceRefresh) {
            const cachedClips = cache.get<Clip[]>(cacheKey);
            if (cachedClips) {
                ClipsActions.setClips(cachedClips);
                return;
            }
        }

        ClipsActions.setLoading(true);

        if (forceRefresh) {
            import('../../core/dashboardStore.js').then(({ ToastActions }) => {
                ToastActions.info('Actualizando clips...');
            });
        }

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...this.authHeaders()
            };

            const params = [`channel=${this.session!.login}`];
            if (this.session!.apiKey)
                params.push(`apiKey=${encodeURIComponent(this.session!.apiKey)}`);
            else if (this.session!.token)
                params.push(`token=${encodeURIComponent(this.session!.token)}`);

            const url = `${API_ENDPOINTS.CLIPS}?${params.join('&')}`;

            const response = await fetch(url, { headers });

            if (!response.ok) {
                const isAuthError = response.status === 401 || response.status === 403;
                throw new Error(isAuthError ? 'auth_error' : 'fetch_error');
            }

            const data = await response.json();
            const clips = Array.isArray(data) ? data : data.clips || data.data || [];

            ClipsActions.setClips(clips);

            if (clips.length > 0) {
                cache.set(cacheKey, clips, CACHE_TTL);
            }
        } catch (error) {
            this.handleError(error);
        }
    },

    handleError(error: unknown) {
        const isAuthError = (error as Error).message === 'auth_error';
        import('../../core/dashboardStore.js').then(({ ToastActions }) => {
            ToastActions.error(isAuthError ? AuthMessages.expired : ClipsMessages.loadError);
        });
        ClipsActions.setError(isAuthError ? 'auth_error' : 'fetch_error');
    },

    renderSkeleton(container: HTMLElement) {
        container.innerHTML = Array(8)
            .fill(0)
            .map(
                () => `
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
        `
            )
            .join('');
    },

    render(clipsState: import('../../core/dashboardStore.js').ClipsState) {
        const container = document.getElementById('clips-gallery');
        if (!container) return;

        // Mostrar skeleton si está cargando y no hay clips
        if (clipsState.isLoading && clipsState.clips.length === 0) {
            this.renderSkeleton(container);
            return;
        }

        // Mostrar mensaje de error
        if (clipsState.error === 'auth_error') {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    <h3>${AuthMessages.expiredTitle}</h3>
                    <p>${AuthMessages.expiredMsg}</p>
                    <button id="relogin-clips-btn" class="btn-primary" style="margin-top:10px;">
                        ${AuthMessages.reloginBtn}
                    </button>
                </div>
            `;
            document.getElementById('relogin-clips-btn')?.addEventListener('click', () => {
                import('../../core/auth.js').then((m) => m.Auth.relogin());
            });
            return;
        }

        if (clipsState.error) {
            container.innerHTML = Messages.Common.error(clipsState.error);
            const retryBtn = document.getElementById('retry-clips-btn');
            if (retryBtn) retryBtn.onclick = () => this.loadClips();
            return;
        }

        // Mostrar estado vacío
        if (clipsState.filteredClips.length === 0) {
            container.innerHTML = ClipsMessages.empty;
            this.removeLoadMoreButton();
            return;
        }

        // Renderizar clips de la página actual
        this.removeLoadMoreButton();

        const start = (clipsState.currentPage - 1) * clipsState.itemsPerPage;
        const end = start + clipsState.itemsPerPage;
        const pageClips = clipsState.filteredClips.slice(0, end);

        container.innerHTML = '';
        const fragment = document.createDocumentFragment();

        pageClips.forEach((clip) => {
            fragment.appendChild(this.buildCard(clip));
        });

        container.appendChild(fragment);

        // Agregar botón "Ver más" si hay más clips
        if (end < clipsState.filteredClips.length) {
            this.addLoadMoreButton(container);
        }
    },

    removeLoadMoreButton() {
        const loadMore = document.getElementById('clips-load-more');
        if (loadMore) loadMore.remove();
    },

    addLoadMoreButton(container: HTMLElement) {
        const btnContainer = document.createElement('div');
        btnContainer.id = 'clips-load-more';
        btnContainer.className = 'load-more-container';

        const btn = document.createElement('button');
        btn.className = 'btn-secondary';
        btn.textContent = 'Ver más clips';
        btn.onclick = () => {
            ClipsActions.nextPage();
        };

        btnContainer.appendChild(btn);
        container.after(btnContainer);
    },

    buildCard(clip: StoreClip) {
        const card = document.createElement('div');
        card.className = 'clip-card fade-in';
        card.dataset.id = clip.id;

        const safeTitle = UI.escapeHTML(clip.title);
        const safeUrl = UI.escapeHTML(clip.url);
        const safeThumb = UI.escapeHTML(clip.thumbnail_url);

        const dateStr = new Date(clip.created_at).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const viewsStr = clip.view_count.toLocaleString('es-ES');

        const state = dashboardStore.getState().clips;
        const isFav = state.favorites.includes(clip.id);
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
                import('../../core/dashboardStore.js').then(({ ToastActions }) => {
                    ToastActions.success('Enlace copiado');
                });

                setTimeout(() => {
                    icon.className = originalClass;
                }, 2000);
            });
        });

        card.querySelector('.fav-btn')!.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const userId = this.session?.userId;
            if (userId) {
                ClipsActions.toggleFavorite(clipId, userId);
                // Actualizar el botón visualmente
                this.updateFavoriteBtn(clipId);
            }
        });
    },

    updateFavoriteBtn(clipId: string) {
        const card = document.querySelector(`.clip-card[data-id="${clipId}"]`);
        if (!card) return;

        const btn = card.querySelector('.fav-btn');
        if (!btn) return;
        const icon = btn.querySelector('i');
        const state = dashboardStore.getState().clips;
        const isFav = state.favorites.includes(clipId);

        if (isFav) {
            btn.classList.add('active');
            if (icon) icon.className = 'fa-solid fa-star';
        } else {
            btn.classList.remove('active');
            if (icon) icon.className = 'fa-regular fa-star';
        }
    }
};
