import { type ReactNode, useEffect, useRef, useState } from 'react';

const viewOpts: IntersectionObserverInit = {
    threshold: 0.2,
    rootMargin: '0px 0px -48px 0px'
};

function useInView<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || shown) return;
        const io = new IntersectionObserver(([entry]) => {
            if (!entry?.isIntersecting) return;
            setShown(true);
            io.disconnect();
        }, viewOpts);
        io.observe(el);
        return () => io.disconnect();
    }, [shown]);

    return { ref, shown };
}

type RevealProps = {
    children: ReactNode;
    className?: string;
    delay?: number;
    style?: React.CSSProperties;
};

export function LandingReveal({ children, className, delay = 0, style }: RevealProps) {
    const { ref, shown } = useInView<HTMLDivElement>();

    return (
        <div
            ref={ref}
            className={`${
                shown
                    ? 'motion-safe:animate-about-in motion-safe:[animation-fill-mode:both] motion-reduce:animate-none'
                    : 'opacity-0'
            } ${className ?? ''}`.trim()}
            style={{
                ...(shown && delay ? { animationDelay: `${delay}s` } : {}),
                ...style
            }}
        >
            {children}
        </div>
    );
}

export function LandingRevealList({
    children,
    className
}: {
    children: ReactNode;
    className?: string;
}) {
    return <ul className={className}>{children}</ul>;
}

export function LandingRevealItem({
    children,
    className
}: {
    children: ReactNode;
    className?: string;
}) {
    const { ref, shown } = useInView<HTMLLIElement>();

    return (
        <li
            ref={ref}
            className={`${
                shown
                    ? 'motion-safe:animate-about-in motion-safe:[animation-fill-mode:both] motion-reduce:animate-none'
                    : 'opacity-0'
            } ${className ?? ''}`.trim()}
        >
            {children}
        </li>
    );
}
