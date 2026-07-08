(function () {
    const script = document.currentScript;
    if (!script) return;

    const swUrl = script.getAttribute('data-sw-url');
    const swScope = script.getAttribute('data-sw-scope') || '/';

    if (!('serviceWorker' in navigator) || !swUrl) return;

    window.addEventListener('load', function () {
        navigator.serviceWorker.register(swUrl, { scope: swScope }).catch(function () {});
    });
})();
