import { UI } from '../ui.js';
import { Messages } from '../utils/messages.js';
import { API_ENDPOINTS } from '../utils/constants.js';
import { cache, CACHE_TTL } from '../utils/cacheService.js';

/**
 * Módulo de gestión y visualización de clips de Twitch
 * @module ClipsModule
 */
export const ClipsModule = {
    /** @type {Object | null} Sesión del usuario actual */
    session: null as any,
    /** @type {boolean} Estado de inicialización del módulo */
    initialized: false,
    /** @type {Array<Object>} Lista completa de clips cargados */
    allClips: [] as any[],
    /** @type {Array<Object>} Lista filtrada de clips actuales */
    currentClips: [] as any[],
    /** @type {Array<string>} IDs de clips marcados como favoritos */
    favorites: [] as string[],
    /** @type {IntersectionObserver | null} Observador para lazy loading */
    observer: null as IntersectionObserver | null,
    /** @type {number} Página actual de paginación */
    currentPage: 1,
    /** @type {number} Clips por página */
    ITEMS_PER_PAGE: 20,

    /**
     * Inicializa el módulo de clips
     * @param {Object} session - Objeto de sesión del usuario
     * @returns {Promise<void>}
     */
    async init(session: any) {
        this.session = session;
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

        if (this.initialized) return;
        this.initialized = true;
    },

    /**
     * Carga los favoritos desde localStorage
     */
    loadFavorites() {
        try {
            const saved = localStorage.getItem(`clips_favs_${this.session.userId}`);
            this.favorites = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading favorites', e);
            this.favorites = [];
        }
    },

    /**
     * Guarda los favoritos en localStorage
     */
    saveFavorites() {
        try {
            localStorage.setItem(`clips_favs_${this.session.userId}`, JSON.stringify(this.favorites));
        } catch (e) {
            console.error('Error saving favorites', e);
        }
    },

    /**
     * Alterna el estado de favorito de un clip
     * @param {string} clipId - ID del clip
     */
    toggleFavorite(clipId: string) {
        if (this.favorites.includes(clipId)) {
            this.favorites = this.favorites.filter(id => id !== clipId);
            UI.showToast('Clip eliminado de favoritos', 'info');
        } else {
            this.favorites.push(clipId);
            UI.showToast('Clip añadido a favoritos', 'success');
        }
        this.saveFavorites();
        this.updateFavoriteBtn(clipId);
    },

    /**
     * Configura la interfaz de usuario inicial y eventos
     */
    setupUI() {
        this.loadClips();
        this.setupFilters();

        const refreshBtn = document.getElementById('refresh-clips-btn');
        if (refreshBtn && refreshBtn.parentNode) {
            const newBtn = refreshBtn.cloneNode(true);
            refreshBtn.parentNode.replaceChild(newBtn, refreshBtn);

            newBtn.addEventListener('click', () => {
                this.loadClips(true);
            });
        }
    },

    /**
     * Configura los listeners para búsqueda y ordenamiento
     */
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

    /**
     * Utilidad para limitar la frecuencia de ejecución de una función
     * @param {Function} func - Función a ejecutar
     * @param {number} wait - Tiempo de espera en ms
     * @returns {Function} Función debounced
     */
    debounce(func: Function, wait: number) {
        let timeout: any;
        return function executedFunction(...args: any[]) {
            const later = () => {
                clearTimeout(timeout);
                // @ts-ignore
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Carga los clips desde la API o Caché
     * @param {boolean} [forceRefresh=false] - Forzar recarga desde API
     */
    async loadClips(forceRefresh = false) {
        const container = document.getElementById('clips-gallery');
        if (!container) return;

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
                cache.set(cacheKey, clips, CACHE_TTL.CLIPS);
            }

            this.filterAndRender();
        } catch (error) {
            this.handleError(error, container);
        }
    },

    /**
     * Maneja los errores de carga
     * @param {Error} error - Error capturado
     * @param {HTMLElement} container - Contenedor para mostrar el error
     */
    handleError(error: any, container: HTMLElement) {
        const isAuthError = error.message === 'auth_error';
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
            container.innerHTML = Messages.Common.error(error.message);
            const retryBtn = document.getElementById('retry-clips-btn');
            if (retryBtn) retryBtn.onclick = () => this.loadClips();
        }
    },

    /**
     * Renderiza esqueletos de carga
     * @param {HTMLElement} container 
     */
    renderSkeleton(container: HTMLElement) {
        container.innerHTML = Array(8).fill(0).map(() => `
            <div class="skeleton-card skeleton-loading">
                <div class="skeleton-thumb"></div>
                <div class="skeleton-info">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-meta">
                        <div class="skeleton-text"></div>
                        <div class="skeleton-text"></div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Filtra y ordena los clips para renderizar
     */
    filterAndRender() {
        const searchTerm = (document.getElementById('clips-search') as HTMLInputElement)?.value.toLowerCase() || '';
        const sortValue = (document.getElementById('clips-sort') as HTMLSelectElement)?.value || 'date-desc';

        let filtered = this.allClips.filter(clip =>
            clip.title.toLowerCase().includes(searchTerm)
        );

        filtered.sort((a, b) => {
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

    /**
     * Renderiza la página actual de clips
     */
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

        pageClips.forEach(clip => {
            fragment.appendChild(this.buildCard(clip));
        });

        clipsGallery.appendChild(fragment);

        if (end < this.currentClips.length) {
            this.addLoadMoreButton(clipsGallery);
        }
    },

    /**
     * Agrega el botón de "Cargar más"
     * @param {HTMLElement} container 
     */
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

    /**
     * Construye el elemento DOM de una tarjeta de clip
     * Refactorizado para aislar la lógica de creación
     * @param {Object} clip - Datos del clip
     * @returns {HTMLElement} Elemento tarjeta
     */
    buildCard(clip: any) {
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

        // Configurar Lazy Loading
        const img = card.querySelector('img');
        if (this.observer && img) this.observer.observe(img);

        // Configurar Eventos
        this.attachCardEvents(card, safeUrl, clip.id);

        return card;
    },

    /**
     * Adjunta los eventos a los botones de la tarjeta
     * @param {HTMLElement} card - Elemento tarjeta
     * @param {string} url - URL del clip
     * @param {string} clipId - ID del clip
     */
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

    /**
     * Actualiza el estado visual del botón de favorito
     * @param {string} clipId - ID del clip a actualizar
     */
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
