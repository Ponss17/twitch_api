import type { CSSProperties } from 'react';

const pulse = 'animate-pulse bg-white/[0.04]';

interface SkeletonProps {
    className?: string;
    style?: CSSProperties;
    'aria-hidden'?: boolean;
}

/** Bloque base con animación pulse. */
function Skeleton({ className = '', style, 'aria-hidden': ariaHidden = true }: SkeletonProps) {
    return (
        <div
            className={`${pulse} rounded-md ${className}`.trim()}
            style={style}
            aria-hidden={ariaHidden}
        />
    );
}

function SkeletonCircle({ className = 'h-10 w-10' }: { className?: string }) {
    return <Skeleton className={`rounded-full ${className}`} />;
}

/** Spinner de sesión → skeleton del shell del dashboard. */
export function DashboardSessionSkeleton({ tab = 'home' }: { tab?: string }) {
    let ContentSkeleton = HomeViewSkeleton;
    if (tab === 'analytics') ContentSkeleton = AnalyticsSkeleton;
    else if (tab === 'settings') ContentSkeleton = SettingsViewSkeleton;
    else if (tab === 'trends') ContentSkeleton = TrendsSkeleton;
    else if (tab === 'stalker') ContentSkeleton = StalkerViewSkeleton;
    else if (tab === 'clips') ContentSkeleton = () => <div className="animate-fade-soft" aria-busy="true"><ClipsGridSkeleton /></div>;
    else if (tab !== 'home') ContentSkeleton = CommandViewSkeleton;

    return (
        <div className="flex min-h-screen bg-[#09090b]" aria-busy="true" aria-label="Cargando dashboard">
            <aside className="hidden w-[240px] shrink-0 p-4 lg:block">
                <Skeleton className="mb-6 h-10 w-40 bg-transparent" />
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
                    <ContentSkeleton />
                </div>
            </main>
        </div>
    );
}

export function HomeViewSkeleton() {
    return (
        <div className="animate-fade-soft" aria-busy="true" aria-label="Cargando panel">
            <SettingsHeroSkeleton />
            <div className="grid grid-cols-1 items-stretch gap-5 min-[1001px]:grid-cols-[1fr_310px]">
                <div className="flex flex-col rounded-xl border border-white/[0.04] bg-bg-card h-[510px]">
                    <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.04] px-5 py-3.5">
                        <Skeleton className="h-8 w-8 rounded-lg bg-transparent border border-white/[0.04]" />
                        <Skeleton className="h-4 w-40 bg-transparent" />
                    </div>
                    <div className="flex-1 p-5 space-y-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="h-8 w-8 rounded-full bg-white/[0.02]" />
                                <div className="space-y-2 flex-1 pt-1.5">
                                    <Skeleton className="h-3 w-3/4 max-w-[200px]" />
                                    <Skeleton className="h-2 w-1/2 max-w-[150px]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col rounded-xl border border-white/[0.04] bg-bg-card h-[510px]">
                    <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.04] px-5 py-3.5">
                        <Skeleton className="h-8 w-8 rounded-lg bg-transparent border border-white/[0.04]" />
                        <Skeleton className="h-4 w-24 bg-transparent" />
                    </div>
                    <div className="flex-1 p-4 flex flex-col gap-6">
                        <div className="space-y-2">
                            <Skeleton className="h-2.5 w-32 bg-transparent mb-3" />
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton className="h-[44px] w-full rounded-lg bg-transparent border border-white/[0.04]" key={i} />
                            ))}
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-2.5 w-24 bg-transparent mb-3" />
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton className="h-[44px] w-full rounded-lg bg-transparent border border-white/[0.04]" key={i} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function SettingsHeroSkeleton() {
    return (
        <div
            className="relative mb-8 overflow-hidden rounded-xl border border-white/[0.03] bg-zinc-900/20 px-8 py-8 shadow-2xl shadow-black/20 backdrop-blur-xl"
            aria-busy="true"
            aria-label="Cargando perfil"
        >
            <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-[3.75rem] w-[3.75rem] shrink-0 rounded-xl" />
                    <div className="min-w-0">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-5 w-20 rounded-md" />
                        </div>
                        <Skeleton className="mt-1 h-4 w-64" />
                    </div>
                </div>

                <div className="flex w-full flex-wrap gap-y-4 border-t border-white/[0.06] pt-4 xl:w-auto xl:min-w-[29rem] xl:justify-end xl:border-0 xl:pt-0">
                    <div className="flex min-w-[144px] flex-1 items-center gap-3 pr-6 xl:min-w-[160px] xl:flex-none">
                        <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                        <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-2.5 w-16" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    </div>
                    <div className="flex min-w-[144px] flex-1 items-center gap-3 border-l border-white/[0.08] px-6 xl:min-w-[160px] xl:flex-none">
                        <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                        <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-2.5 w-16" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    </div>
                    <div className="flex min-w-[144px] flex-1 items-center gap-3 border-l border-white/[0.08] pl-6 xl:min-w-[160px] xl:flex-none">
                        <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                        <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-2.5 w-20" />
                            <Skeleton className="h-5 w-28" />
                        </div>
                    </div>
                </div>
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
                <div key={i} className="overflow-hidden rounded-xl border border-white/[0.04] bg-[#09090b]">
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

export function AnalyticsSkeleton() {
    return (
        <div className="animate-fade-soft space-y-6" aria-busy="true" aria-label="Cargando analíticas">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col rounded-xl border border-white/[0.04] bg-bg-card p-5 h-[100px] justify-between">
                        <div className="flex justify-between items-start">
                            <Skeleton className="h-3 w-20 bg-transparent" />
                            <Skeleton className="h-5 w-5 rounded-md bg-transparent border border-white/[0.04]" />
                        </div>
                        <Skeleton className="h-6 w-24 bg-transparent" />
                    </div>
                ))}
            </div>
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="flex flex-col rounded-xl border border-white/[0.04] bg-bg-card lg:col-span-2 h-[350px]">
                    <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4">
                        <Skeleton className="h-4 w-32 bg-transparent" />
                        <Skeleton className="h-4 w-16 bg-transparent" />
                    </div>
                    <div className="flex-1 p-5 flex flex-col justify-between">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-[1px] w-full bg-white/[0.02]" />
                        ))}
                        <Skeleton className="h-32 w-full mt-4 bg-gradient-to-t from-white/[0.03] to-transparent rounded-t-xl" />
                    </div>
                </div>
                
                <div className="flex flex-col rounded-xl border border-white/[0.04] bg-bg-card h-[350px]">
                    <div className="flex items-center gap-3 border-b border-white/[0.04] px-5 py-4">
                        <Skeleton className="h-4 w-40 bg-transparent" />
                    </div>
                    <div className="flex-1 p-5 flex flex-col items-center justify-center gap-6">
                        <Skeleton className="h-32 w-32 rounded-full bg-transparent border-[12px] border-white/[0.02]" />
                        <div className="w-full space-y-2">
                            <Skeleton className="h-2 w-full bg-transparent" />
                            <Skeleton className="h-2 w-4/5 mx-auto bg-transparent" />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="flex flex-col rounded-xl border border-white/[0.04] bg-bg-card h-[300px]">
                    <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4">
                        <Skeleton className="h-4 w-32 bg-transparent" />
                        <Skeleton className="h-4 w-12 bg-transparent" />
                    </div>
                    <div className="flex-1 p-5 space-y-5">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full bg-white/[0.02]" />
                                    <Skeleton className="h-3 w-24 bg-transparent" />
                                </div>
                                <Skeleton className="h-3 w-12 bg-transparent" />
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="flex flex-col rounded-xl border border-white/[0.04] bg-bg-card h-[300px]">
                    <div className="flex items-center gap-3 border-b border-white/[0.04] px-5 py-4">
                        <Skeleton className="h-4 w-48 bg-transparent" />
                    </div>
                    <div className="flex-1 p-5 space-y-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2.5">
                                <div className="flex justify-between">
                                    <Skeleton className="h-2.5 w-20 bg-transparent" />
                                    <Skeleton className="h-2.5 w-10 bg-transparent" />
                                </div>
                                <Skeleton className="h-2 w-full rounded-full bg-white/[0.02]" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function CommandViewSkeleton() {
    return (
        <div className="animate-fade-soft w-full" aria-busy="true" aria-label="Cargando comandos">
            <div className="mb-3 flex flex-col rounded-xl border border-white/[0.04] bg-bg-card">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.04] px-5 py-3.5">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-lg bg-transparent border border-white/[0.04]" />
                        <div className="space-y-1.5">
                            <Skeleton className="h-4 w-32 bg-transparent" />
                            <Skeleton className="h-3 w-48 bg-transparent" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-24 rounded-lg bg-transparent border border-white/[0.04]" />
                </header>
                <div className="p-5 space-y-4">
                    <Skeleton className="h-10 w-full rounded-lg bg-bg-card border border-white/[0.04]" />
                    <Skeleton className="h-32 w-full rounded-lg bg-bg-card border border-white/[0.04]" />
                </div>
            </div>
        </div>
    );
}

export function TrendsSkeleton() {
    return (
        <div className="animate-fade-soft w-full" aria-busy="true" aria-label="Cargando tendencias">
            <div className="mb-3 flex flex-col rounded-xl border border-white/[0.04] bg-bg-card">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.04] px-5 py-3.5">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-lg bg-transparent border border-white/[0.04]" />
                        <div className="space-y-1.5">
                            <Skeleton className="h-4 w-40 bg-transparent" />
                            <Skeleton className="h-3 w-56 bg-transparent" />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Skeleton className="h-8 w-32 rounded-lg bg-transparent border border-white/[0.04]" />
                        <Skeleton className="h-8 w-32 rounded-lg bg-transparent border border-white/[0.04]" />
                    </div>
                </header>
                <div className="p-5">
                    <Skeleton className="h-[400px] w-full rounded-lg bg-bg-card border border-white/[0.04]" />
                </div>
            </div>
        </div>
    );
}

export function StalkerViewSkeleton() {
    return (
        <div className="animate-fade-soft w-full" aria-busy="true" aria-label="Cargando stalker">
            <div className="mb-3 flex flex-col rounded-xl border border-white/[0.04] bg-bg-card">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.04] px-5 py-3.5">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-lg bg-transparent border border-white/[0.04]" />
                        <div className="space-y-1.5">
                            <Skeleton className="h-4 w-40 bg-transparent" />
                            <Skeleton className="h-3 w-56 bg-transparent" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-48 rounded-lg bg-transparent border border-white/[0.04]" />
                </header>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/[0.04] bg-black/20 text-[#a1a1aa]">
                                <th className="px-5 py-3"><Skeleton className="h-3 w-12 bg-transparent" /></th>
                                <th className="px-5 py-3"><Skeleton className="h-3 w-16 bg-transparent" /></th>
                                <th className="px-5 py-3"><Skeleton className="h-3 w-20 bg-transparent" /></th>
                                <th className="px-5 py-3"><Skeleton className="ml-auto h-3 w-12 bg-transparent" /></th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 8 }).map((_, i) => <StalkerRowSkeleton key={i} />)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export function SettingsViewSkeleton() {
    return (
        <div className="animate-fade-soft space-y-6" aria-busy="true" aria-label="Cargando ajustes">
            <SettingsHeroSkeleton />
            <div className="mb-6 border-b border-white/[0.04]">
                <div className="flex gap-6 pb-2">
                    <Skeleton className="h-8 w-24 bg-transparent" />
                    <Skeleton className="h-8 w-32 bg-transparent" />
                    <Skeleton className="h-8 w-32 bg-transparent" />
                </div>
            </div>
            <div className="space-y-4">
                <Skeleton className="h-[200px] w-full rounded-xl bg-bg-card border border-white/[0.04]" />
                <Skeleton className="h-[200px] w-full rounded-xl bg-bg-card border border-white/[0.04]" />
            </div>
        </div>
    );
}
