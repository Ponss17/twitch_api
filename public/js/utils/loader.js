export const Loader = {
    loaded: new Set(),
    loading: new Map(),

    loadCSS(path) {
        if (this.loaded.has(path)) return Promise.resolve();

        if (this.loading.has(path)) return this.loading.get(path);

        const promise = new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = path;
            link.onload = () => {
                this.loaded.add(path);
                this.loading.delete(path);
                resolve();
            };
            link.onerror = (e) => {
                this.loading.delete(path);
                console.warn(`[Loader] Warning: Failed to load CSS: ${path}. Proceeding without it.`);
                resolve();
            };
            document.head.appendChild(link);
        });

        this.loading.set(path, promise);
        return promise;
    }
};
