import type { CSSProperties, ReactNode } from 'react';

const pulse = 'animate-pulse bg-bg-tertiary';

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

export function SkeletonText({ className = '' }: { className?: string }) {
    return <Skeleton className={`h-4 ${className}`} />;
}

export function SkeletonCircle({ className = 'h-10 w-10' }: { className?: string }) {
    return <Skeleton className={`rounded-full ${className}`} />;
}

/** Spinner de sesión → skeleton del shell del dashboard. */
export function DashboardSessionSkeleton() {
    return (
        <div className="flex min-h-screen bg-[#09090b]" aria-busy="true" aria-label="Cargando dashboard">
            <aside className="hidden w-[280px] shrink-0 border-r border-white/[0.08] p-4 lg:block">
                <Skeleton className="mb-6 h-10 w-40" />
                <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))}
                </div>
            </aside>
            <main className="flex flex-1 flex-col">
                <div className="flex h-20 items-center gap-4 border-b border-white/[0.08] px-6">
                    <Skeleton className="h-8 w-48" />
                    <div className="ml-auto flex items-center gap-3">
                        <SkeletonCircle className="h-9 w-9" />
                        <Skeleton className="hidden h-4 w-24 md:block" />
                    </div>
                </div>
                <div className="mx-auto w-full max-w-[1600px] flex-1 p-6">
                    <HomeViewSkeleton />
                </div>
            </main>
        </div>
    );
}

export function HomeViewSkeleton() {
    return (
        <div className="space-y-6" aria-busy="true" aria-label="Cargando panel">
            <Skeleton className="h-[220px] w-full rounded-[24px]" />
            <div className="grid gap-4 lg:grid-cols-2">
                <Skeleton className="h-[280px] w-full rounded-xl" />
                <Skeleton className="h-[280px] w-full rounded-xl" />
            </div>
        </div>
    );
}

export function ProfileHeroSkeleton() {
    return (
        <div
            className="relative mb-6 overflow-hidden rounded-[24px] border border-white/[0.08] bg-bg-secondary p-8"
            aria-busy="true"
            aria-label="Cargando perfil"
        >
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
                <SkeletonCircle className="h-24 w-24 shrink-0" />
                <div className="flex flex-1 flex-col items-center gap-3 md:items-start">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-full max-w-md" />
                    <div className="flex gap-2">
                        <Skeleton className="h-7 w-24 rounded-[10px]" />
                        <Skeleton className="h-7 w-28 rounded-[10px]" />
                    </div>
                </div>
                <div className="flex gap-6">
                    <Skeleton className="h-14 w-20" />
                    <Skeleton className="h-14 w-20" />
                </div>
            </div>
        </div>
    );
}

export function ProfileActivitySkeleton() {
    return (
        <div className="mb-3 rounded-xl border border-white/[0.08] bg-bg-card p-5">
            <Skeleton className="mb-4 h-6 w-56" />
            <div className="grid gap-4 min-[1024px]:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-[100px] w-full rounded-xl" />
                ))}
            </div>
        </div>
    );
}

export function StalkerRowSkeleton() {
    return (
        <tr>
            <td className="border-b border-white/[0.03] px-5 py-3">
                <SkeletonCircle className="h-8 w-8" />
            </td>
            <td className="border-b border-white/[0.03] px-5 py-3">
                <Skeleton className="h-4 w-24" />
            </td>
            <td className="border-b border-white/[0.03] px-5 py-3">
                <Skeleton className="h-3.5 w-20" />
            </td>
            <td className="border-b border-white/[0.03] px-5 py-3 text-right">
                <Skeleton className="ml-auto h-7 w-14 rounded-md" />
            </td>
        </tr>
    );
}

export function ClipsGridSkeleton({ count = 6, className = '' }: { count?: number; className?: string }) {
    return (
        <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 ${className}`.trim()}
            aria-busy="true"
            aria-label="Cargando clips"
        >
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-white/[0.08] bg-bg-secondary">
                    <Skeleton className="aspect-video w-full rounded-none" />
                    <div className="space-y-2 p-3">
                        <Skeleton className="h-4 w-4/5" />
                        <div className="flex justify-between gap-2">
                            <Skeleton className="h-3 w-[30%]" />
                            <Skeleton className="h-3 w-[30%]" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonWrap({ children, label }: { children: ReactNode; label: string }) {
    return (
        <div aria-busy="true" aria-label={label}>
            {children}
        </div>
    );
}
