import type { ReactNode } from 'react';
import { LandingFloatIcons } from './LandingMotif';

export function LandingStage({
    id,
    children,
    className = ''
}: {
    id?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section id={id} className={`relative scroll-mt-24 px-5 pt-16 pb-20 md:px-8 md:pt-24 md:pb-28 ${className}`}>
            <LandingFloatIcons layout="c" side="left" />
            <div className="relative z-[1] mx-auto max-w-[1120px] rounded-2xl border border-white/[0.07] bg-bg-secondary px-5 py-10 md:rounded-3xl md:px-10 md:py-14">
                <div
                    className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent"
                    aria-hidden
                />
                {children}
            </div>
        </section>
    );
}
