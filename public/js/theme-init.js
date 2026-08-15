(function () {
    try {
        var themes = {
            dark: '#09090b',
            light: '#f8fafc',
            liga: '#0b0c10',
            minimal: '#000000',
            matrix: '#050a06'
        };
        var selected = localStorage.getItem('los_perris_theme') || 'dark';
        var root = document.documentElement;
        if (selected === 'dark') root.removeAttribute('data-theme');
        else root.setAttribute('data-theme', selected);
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', themes[selected] || themes.dark);
        if (localStorage.getItem('twitch_api_session')) {
            root.setAttribute('data-lp-sess', '1');
        } else {
            root.removeAttribute('data-lp-sess');
        }
    } catch {
        // Theme initialization must never block rendering.
    }
})();
