import { UI } from "../../core/ui.js";
import { Messages } from "../../shared/i18n/messages.js";
import { ClipsMessages } from "./clips/messages.js";
import { AuthMessages } from "../../shared/i18n/authMessages.js";
import { DASHBOARD_CONFIG } from "./dashboard-config.js";
import { cache, CACHE_TTL } from "../../services/cacheService.js";

const { API_ENDPOINTS } = DASHBOARD_CONFIG;

const ClipsModule = {
    session: null,
    initialized: false,
    allClips: [],
    currentClips: [],
    favorites: [],
    observer: null,
    currentPage: 1,
    ITEMS_PER_PAGE: 20,
    cssLoaded: false,

    init(session) {
        this.session = session;
        if (!this.cssLoaded) {
            import("../../shared/utils/loader.js").then(({ Loader }) => {
                Loader.loadCSS("css/sections/clips.css");
            });
            this.cssLoaded = true;
        }
        this.loadFavorites();
        if (!this.observer) {
            this.observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove("lazy-img");
                        obs.unobserve(img);
                    }
                });
            }, {
                rootMargin: "50px"
            });
        }
        this.setupUI();
        this.initialized = true;
    },

    activate() {
        if (this.allClips.length === 0) {
            this.loadClips();
        }
    },

    deactivate() {
        if (this.observer) {
            this.observer.disconnect();
        }
    },

    loadFavorites() {
        if (this.session) {
            try {
                const stored = localStorage.getItem(`clips_favs_${this.session.userId}`);
                this.favorites = stored ? JSON.parse(stored) : [];
            } catch (e) {
                console.error("Error loading favorites", e);
                this.favorites = [];
            }
        }
    },

    saveFavorites() {
        if (this.session) {
            try {
                localStorage.setItem(`clips_favs_${this.session.userId}`, JSON.stringify(this.favorites));
            } catch (e) {
                console.error("Error saving favorites", e);
            }
        }
    },

    toggleFavorite(clipId) {
        if (this.favorites.includes(clipId)) {
            this.favorites = this.favorites.filter(id => id !== clipId);
            UI.showToast("Clip eliminado de favoritos", "info");
        } else {
            this.favorites.push(clipId);
            UI.showToast("Clip añadido a favoritos", "success");
        }
        this.saveFavorites();
        this.updateFavoriteBtn(clipId);
    },

    setupUI() {
        this.setupFilters();
        const refreshBtn = document.getElementById("refresh-clips-btn");
        if (refreshBtn) {
            refreshBtn.addEventListener("click", () => {
                this.loadClips(true);
            });
        }
    },

    setupFilters() {
        const searchInput = document.getElementById("clips-search");
        const sortSelect = document.getElementById("clips-sort");

        if (searchInput) {
            searchInput.addEventListener("input", this.debounce(() => {
                this.filterAndRender();
            }, 300));
        }

        if (sortSelect) {
            sortSelect.addEventListener("change", () => {
                this.filterAndRender();
            });
        }
    },

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    async loadClips(forceRefresh = false) {
        const gallery = document.getElementById("clips-gallery");
        if (!gallery || !this.session) return;

        const cacheKey = `clips_${this.session.userId}`;
        if (!forceRefresh) {
            const cached = cache.get(cacheKey);
            if (cached) {
                this.allClips = cached;
                this.filterAndRender();
                return;
            }
        }

        this.renderSkeleton(gallery);
        if (forceRefresh) UI.showToast("Actualizando clips...", "info");

        try {
            const { apiKey, token, login } = this.session;
            const headers = { "Content-Type": "application/json" };
            let url = API_ENDPOINTS.CLIPS;

            if (token) {
                headers.Authorization = `Bearer ${token}`;
                url += `?channel=${login}`;
            } else if (apiKey) {
                url += `?apiKey=${apiKey}&channel=${login}`;
            }

            const response = await fetch(url, { headers });

            if (!response.ok) {
                const isAuthError = response.status === 401 || response.status === 403;
                throw new Error(isAuthError ? "auth_error" : "fetch_error");
            }

            const data = await response.json();
            const clips = Array.isArray(data) ? data : (data.clips || data.data || []);

            this.allClips = clips;
            if (clips.length > 0) {
                cache.set(cacheKey, clips, CACHE_TTL);
            }
            this.filterAndRender();
        } catch (error) {
            this.handleError(error, gallery);
        }
    },

    handleError(error, container) {
        const isAuthError = error.message === "auth_error";
        UI.showToast(isAuthError ? AuthMessages.expired : ClipsMessages.loadError, "error");

        if (isAuthError) {
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
            document.getElementById("relogin-clips-btn")?.addEventListener("click", () => {
                import("../../core/auth.js").then(mod => mod.Auth.relogin());
            });
        } else {
            container.innerHTML = Messages.Common.error(error.message);
            const retryBtn = document.getElementById("retry-clips-btn");
            if (retryBtn) {
                retryBtn.onclick = () => this.loadClips();
            }
        }
    },

    renderSkeleton(container) {
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
        `).join("");
    },

    filterAndRender() {
        const searchTerm = document.getElementById("clips-search")?.value.toLowerCase() || "";
        const sortValue = document.getElementById("clips-sort")?.value || "date-desc";

        let filtered = this.allClips.filter(clip => clip.title.toLowerCase().includes(searchTerm));

        filtered.sort((a, b) => {
            switch (sortValue) {
                case "date-desc": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case "date-asc": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case "views-desc": return b.view_count - a.view_count;
                case "views-asc": return a.view_count - b.view_count;
                default: return 0;
            }
        });

        this.currentClips = filtered;
        this.currentPage = 1;
        const gallery = document.getElementById("clips-gallery");
        if (gallery) gallery.innerHTML = "";
        this.renderPage();
    },

    renderPage() {
        const gallery = document.getElementById("clips-gallery");
        if (!gallery) return;

        if (this.currentClips.length === 0) {
            gallery.innerHTML = ClipsMessages.empty;
            return;
        }

        const loadMore = document.getElementById("clips-load-more");
        if (loadMore) loadMore.remove();

        const start = (this.currentPage - 1) * this.ITEMS_PER_PAGE;
        const end = start + this.ITEMS_PER_PAGE;
        const slice = this.currentClips.slice(start, end);

        const fragment = document.createDocumentFragment();
        slice.forEach(clip => {
            fragment.appendChild(this.buildCard(clip));
        });

        gallery.appendChild(fragment);

        if (end < this.currentClips.length) {
            this.addLoadMoreButton(gallery);
        }
    },

    addLoadMoreButton(container) {
        const div = document.createElement("div");
        div.id = "clips-load-more";
        div.className = "load-more-container";

        const btn = document.createElement("button");
        btn.className = "btn-secondary";
        btn.innerHTML = "Ver más clips";
        btn.onclick = () => {
            this.currentPage++;
            this.renderPage();
        };

        div.appendChild(btn);
        container.after(div);
    },

    buildCard(clip) {
        const card = document.createElement("div");
        card.className = "clip-card fade-in";
        card.dataset.id = clip.id;

        const title = UI.escapeHTML(clip.title);
        const url = UI.escapeHTML(clip.url);
        const thumb = UI.escapeHTML(clip.thumbnail_url);
        const date = new Date(clip.created_at).toLocaleDateString("es-ES", {
            year: "numeric", month: "short", day: "numeric"
        });
        const views = clip.view_count.toLocaleString("es-ES");
        const isFav = this.favorites.includes(clip.id);
        const starClass = isFav ? "fa-solid fa-star" : "fa-regular fa-star";
        const btnClass = isFav ? "active" : "";

        card.innerHTML = `
            <div class="clip-actions">
                <button class="btn-clip-action fav-btn ${btnClass}" title="Favorito" data-id="${clip.id}">
                    <i class="${starClass}"></i>
                </button>
                <button class="btn-clip-action copy-btn" title="Copiar enlace" data-url="${url}">
                    <i class="fa-solid fa-link"></i>
                </button>
            </div>
            <a href="${url}" target="_blank" class="clip-link">
                <div class="clip-thumb-wrapper">
                    <img data-src="${thumb}" class="clip-thumb lazy-img" alt="${title}" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiA5IiBzdHlsZT0iYmFja2dyb3VuZDojMjIyOyIvPgo=">
                </div>
                <div class="clip-info">
                    <div class="clip-title" title="${title}">${title}</div>
                    <div class="clip-meta">
                        <span><i class="fa-solid fa-eye"></i> ${views}</span>
                        <span>${date}</span>
                    </div>
                </div>
            </a>
        `;

        const img = card.querySelector("img");
        if (this.observer && img) {
            this.observer.observe(img);
        }

        this.attachCardEvents(card, url, clip.id);
        return card;
    },

    attachCardEvents(card, url, clipId) {
        card.querySelector(".copy-btn").addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard.writeText(url).then(() => {
                const icon = e.currentTarget.querySelector("i");
                const originalClass = icon.className;
                icon.className = "fa-solid fa-check";
                UI.showToast("Enlace copiado", "success");
                setTimeout(() => {
                    icon.className = originalClass;
                }, 2000);
            });
        });

        card.querySelector(".fav-btn").addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleFavorite(clipId);
        });
    },

    updateFavoriteBtn(clipId) {
        const card = document.querySelector(`.clip-card[data-id="${clipId}"]`);
        if (!card) return;

        const btn = card.querySelector(".fav-btn");
        if (!btn) return;

        const icon = btn.querySelector("i");
        if (this.favorites.includes(clipId)) {
            btn.classList.add("active");
            if (icon) icon.className = "fa-solid fa-star";
        } else {
            btn.classList.remove("active");
            if (icon) icon.className = "fa-regular fa-star";
        }
    }
};

export { ClipsModule };
