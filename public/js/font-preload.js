(function () {
    const link = document.getElementById('geist-font-preload');
    if (!link) return;
    link.onload = function () {
        this.onload = null;
        this.rel = 'stylesheet';
    };
})();
