export const HtmlLoader = {
    cache: new Map(),


    async load(url, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container not found: ${containerId}`);
            return;
        }

        if (container.innerHTML.trim().length > 0 && container.dataset.loaded === 'true') {
            return;
        }

        try {
            let html = '';

            if (this.cache.has(url)) {
                html = this.cache.get(url);
            } else {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
                html = await res.text();
                this.cache.set(url, html);
            }

            container.innerHTML = html;
            container.dataset.loaded = 'true';

            const event = new CustomEvent('html-loaded', { detail: { url, containerId } });
            document.dispatchEvent(event);

        } catch (error) {
            console.error('Error loading HTML:', error);
            container.innerHTML = `<div class="error-message">Error cargando contenido: ${error.message}</div>`;
        }
    }
};
