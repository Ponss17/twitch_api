import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { btnSecondary, modalBtnPrimary } from '@/core/utils/tw';
import { useTranslation } from '@/core/i18n/I18nContext';
import type { OnboardingStepId } from './onboarding';

const PAD = 8;

type Rect = { top: number; left: number; width: number; height: number };

function readTargetRect(selector: string): Rect | null {
    const el = document.querySelector(selector);
    if (!(el instanceof HTMLElement)) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return null;
    const top    = Math.max(0, r.top    - PAD);
    const left   = Math.max(0, r.left   - PAD);
    const right  = Math.min(window.innerWidth,  r.right  + PAD);
    const bottom = Math.min(window.innerHeight, r.bottom + PAD);
    return { top, left, width: right - left, height: bottom - top };
}

interface OnboardingSpotlightProps {
    stepId: OnboardingStepId;
    selector: string;
    stepIndex: number;
    stepCount: number;
    onNext: () => void;
    onBack: () => void;
    onSkip: () => void;
}

export function OnboardingSpotlight({
    stepId,
    selector,
    stepIndex,
    stepCount,
    onNext,
    onBack,
    onSkip
}: OnboardingSpotlightProps) {
    const { t } = useTranslation();
    const oT = t.home.onboarding;
    const copy = oT.steps[stepId];
    const [rect, setRect] = useState<Rect | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 24, left: 24 });
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = document.querySelector(selector);
        if (el instanceof HTMLElement) {
            el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        }
    }, [selector, stepIndex]);

    useLayoutEffect(() => {
        const update = () => setRect(readTargetRect(selector));
        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        const timer = window.setInterval(update, 120);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
            window.clearInterval(timer);
        };
    }, [selector]);

    useLayoutEffect(() => {
        if (!rect || !tooltipRef.current) return;
        const tip = tooltipRef.current.getBoundingClientRect();
        const gap = 14;
        let top = rect.top + rect.height + gap;
        let left = rect.left;
        if (top + tip.height > window.innerHeight - 12) {
            top = Math.max(12, rect.top - tip.height - gap);
        }
        if (left + tip.width > window.innerWidth - 12) {
            left = Math.max(12, window.innerWidth - tip.width - 12);
        }
        if (left < 12) left = 12;
        setTooltipPos({ top, left });
    }, [rect, copy.title, copy.body]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onSkip();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onSkip]);

    const last = stepIndex === stepCount - 1;
    const progress = oT.stepOf.replace('{step}', String(stepIndex + 1)).replace('{total}', String(stepCount));

    return (
        <div className="fixed inset-0 z-[2100]" role="dialog" aria-modal="true" aria-labelledby="onboarding-tour-title">
            {rect ? (
                <div
                    className="pointer-events-none absolute rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-transparent"
                    style={{
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)'
                    }}
                    aria-hidden
                />
            ) : (
                <div className="absolute inset-0 bg-black/72" aria-hidden />
            )}

            <div
                ref={tooltipRef}
                className="absolute w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border border-border-subtle bg-bg-modal p-4 shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
                style={{ top: tooltipPos.top, left: tooltipPos.left }}
            >
                <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-text-muted">{progress}</p>
                <h2 id="onboarding-tour-title" className="mt-1 text-[1rem] font-semibold text-text-main">
                    {copy.title}
                </h2>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-text-muted">{copy.body}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={onSkip}
                        className="px-2 py-1.5 text-[0.75rem] font-medium text-text-muted transition hover:text-text-main"
                    >
                        {oT.skip}
                    </button>
                    <div className="flex gap-2">
                        {stepIndex > 0 ? (
                            <button type="button" onClick={onBack} className={`${btnSecondary} px-3.5`}>
                                {oT.back}
                            </button>
                        ) : null}
                        <button type="button" onClick={onNext} className={`${modalBtnPrimary} min-w-[7rem] flex-none`}>
                            {last ? oT.finish : oT.next}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
