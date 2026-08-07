import { getBcp47 } from '@/core/i18n/I18nContext';

const animations = new WeakMap<HTMLElement, number>();

function stripHtmlLikeContent(input: string): string {
    let previous: string;
    let current = input;

    do {
        previous = current;
        current = current.replace(/<[^>]*>/g, '');
    } while (current !== previous);

    return current;
}

/** Contador animado — paridad con frontend/core/ui-core.ts */
export function animateValue(
    el: HTMLElement,
    start: number | null,
    end: number,
    duration = 1500,
    suffix = '',
    locale: string = 'es'
): void {
    const prevRaf = animations.get(el);
    if (prevRaf !== undefined) {
        window.cancelAnimationFrame(prevRaf);
        animations.delete(el);
    }

    const textWithoutHtml = stripHtmlLikeContent(el.textContent ?? '');
    const currentVal = parseInt(textWithoutHtml.replace(/[^0-9.-]+/g, ''), 10) || 0;
    const actualStart = start !== null ? start : currentVal;

    const bcp47 = getBcp47(locale);
    const formatted = (value: number) => `${value.toLocaleString(bcp47)}${suffix}`;

    if (actualStart === end) {
        el.textContent = formatted(end);
        return;
    }

    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = Math.floor(easeProgress * (end - actualStart) + actualStart);
        el.textContent = formatted(current);

        if (progress < 1) {
            animations.set(el, window.requestAnimationFrame(step));
        } else {
            animations.delete(el);
            el.textContent = formatted(end);
        }
    };

    animations.set(el, window.requestAnimationFrame(step));
}
