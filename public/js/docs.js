document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.doc-section');
    const navItems = document.querySelectorAll('.nav-item');

    // Intersection Observer for scroll-spy effect
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');

                navItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${id}`) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));

    const updateUrls = () => {
        const baseUrl = window.location.origin;
        document.querySelectorAll('.dynamic-url').forEach(code => {
            const path = code.dataset.path;
            code.textContent = `$(urlfetch ${baseUrl}${path})`;
        });
    };

    updateUrls();
});
