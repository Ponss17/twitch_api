import type { CSSProperties } from 'react';

const pulse = 'animate-pulse bg-text-main/5';

interface SkeletonProps {
    className?: string;
    style?: CSSProperties;
    'aria-hidden'?: boolean;
}

/** Bloque base con animación pulse. */
export function Skeleton({ className = '', style, 'aria-hidden': ariaHidden = true }: SkeletonProps) {
    return (
        <div
            className={`${pulse} rounded-md ${className}`.trim()}
            style={style}
            aria-hidden={ariaHidden}
        />
    );
}

export function SkeletonCircle({ className = 'h-10 w-10' }: { className?: string }) {
    return <Skeleton className={`rounded-full ${className}`} />;
}
