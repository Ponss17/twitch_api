export const HtmlLoader = {
    cache: new Map(),
    async load(url, containerId) {
        const container = document.getElementById(containerId);
        if (!container)
            return;
        if (container.dataset.loaded === 'true')
            return;
        try {
            let html = '';
            if (this.cache.has(url)) {
                html = this.cache.get(url);
            }
            else {
                const res = await fetch(url);
                if (!res.ok)
                    throw new Error(`Status ${res.status}`);
                html = await res.text();
                this.cache.set(url, html);
            }
            container.innerHTML = html;
            container.dataset.loaded = 'true';
            document.dispatchEvent(new CustomEvent('html-loaded', { detail: { url, containerId } }));
        }
        catch (error) {
            console.error('[HtmlLoader] Error:', error);
            const { Messages } = await import('./messages.js');
            container.innerHTML = `<div class="error-state">${Messages.Common.errorLoadingUI(url)}</div>`;
        }
    }
};
