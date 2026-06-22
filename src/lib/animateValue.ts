const animations = new WeakMap<HTMLElement, number>();

/** Contador animado — paridad con frontend/core/ui-core.ts */
export function animateValue(
    el: HTMLElement,
    start: number | null,
    end: number,
    duration = 1500,
    suffix = ''
): void {
    const prevRaf = animations.get(el);
    if (prevRaf !== undefined) {
        window.cancelAnimationFrame(prevRaf);
        animations.delete(el);
    }

    const textWithoutHtml = el.innerHTML.replace(/<[^>]*>?/gm, '');
    const currentVal = parseInt(textWithoutHtml.replace(/[^0-9.-]+/g, ''), 10) || 0;
    const actualStart = start !== null ? start : currentVal;

    if (actualStart === end) {
        el.innerHTML = `${end.toLocaleString('es-ES')}${suffix}`;
        return;
    }

    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = Math.floor(easeProgress * (end - actualStart) + actualStart);
        el.innerHTML = `${current.toLocaleString('es-ES')}${suffix}`;

        if (progress < 1) {
            animations.set(el, window.requestAnimationFrame(step));
        } else {
            animations.delete(el);
            el.innerHTML = `${end.toLocaleString('es-ES')}${suffix}`;
        }
    };

    animations.set(el, window.requestAnimationFrame(step));
}
