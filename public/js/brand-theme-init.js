(function () {
    try {
        document.documentElement.removeAttribute('data-theme');
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', '#09090b');
    } catch {
        // Theme initialization must never block rendering.
    }
})();
