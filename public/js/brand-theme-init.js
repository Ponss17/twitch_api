(function () {
    try {
        document.documentElement.removeAttribute('data-theme');
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', '#09090b');
        if (localStorage.getItem('twitch_api_session')) {
            document.documentElement.setAttribute('data-lp-sess', '1');
        } else {
            document.documentElement.removeAttribute('data-lp-sess');
        }
    } catch {
        // Theme initialization must never block rendering.
    }
})();
