import type { CSSProperties } from 'react';
import { Skeleton } from './SkeletonPrimitives';

/** Fila Nightbot: icono + título/desc + control. */
export function SettingsRowSkeleton({
    controlWidth = '5.5rem',
    titleWidth = '7rem',
    descWidth = '14rem'
}: {
    controlWidth?: string;
    titleWidth?: string;
    descWidth?: string;
}) {
    return (
        <div className="px-4 py-3.5 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                    <Skeleton className="size-8 shrink-0 rounded-md" />
                    <div className="min-w-0 space-y-1.5">
                        <Skeleton className="h-3.5" style={{ width: titleWidth }} />
                        <Skeleton className="h-3 opacity-70" style={{ width: descWidth }} />
                    </div>
                </div>
                <Skeleton className="h-8 shrink-0 rounded-md" style={{ width: controlWidth }} />
            </div>
        </div>
    );
}

/** Grupo Nightbot: título suelto + card con divide-y. */
export function SettingsGroupSkeleton({
    rows,
    titleWidth = '8rem',
    descWidth = '16rem'
}: {
    rows: number;
    titleWidth?: string;
    descWidth?: string;
}) {
    return (
        <section className="mb-9">
            <header className="mb-2.5 space-y-1.5 px-0.5">
                <Skeleton className="h-4" style={{ width: titleWidth }} />
                <Skeleton className="h-3 opacity-70" style={{ width: descWidth }} />
            </header>
            <div className="divide-y divide-border-subtle rounded-lg border border-border-subtle bg-bg-card">
                {Array.from({ length: rows }, (_, i) => (
                    <SettingsRowSkeleton
                        key={i}
                        titleWidth={`${6 + (i % 3)}rem`}
                        descWidth={`${12 + (i % 4) * 1.5}rem`}
                        controlWidth={i % 2 === 0 ? '9rem' : '5.5rem'}
                    />
                ))}
            </div>
        </section>
    );
}

/** Header de panel (Home / Commands / Tools). */
export function PanelCardHeaderSkeleton({
    withSubtitle = true,
    trailing
}: {
    withSubtitle?: boolean;
    trailing?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <div className="min-w-0 space-y-1.5">
                    <Skeleton className="h-3.5 w-36" />
                    {withSubtitle ? <Skeleton className="h-3 w-48 opacity-70" /> : null}
                </div>
            </div>
            {trailing ? <Skeleton className="size-7 shrink-0 rounded-md" /> : null}
        </div>
    );
}

export function ToolPanelHeaderSkeleton({ withConfigBar = true }: { withConfigBar?: boolean }) {
    return (
        <header className="shrink-0 border-b border-border-subtle">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                    <Skeleton className="size-5 shrink-0 rounded" />
                    <Skeleton className="h-3.5 w-40" />
                </div>
                <div className="flex items-center gap-2.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="size-8 rounded-lg" />
                </div>
            </div>
            {withConfigBar ? (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle px-5 py-2.5">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-7 w-28 rounded-lg" />
                        <Skeleton className="h-7 w-20 rounded-lg" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Skeleton className="size-8 rounded-lg" />
                        <Skeleton className="size-8 rounded-lg" />
                        <Skeleton className="size-7 rounded-md" />
                    </div>
                </div>
            ) : null}
        </header>
    );
}

export function ActivityListRowsSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="flex flex-col gap-1 py-2" aria-hidden>
            {Array.from({ length: rows }, (_, i) => {
                const style: CSSProperties = { animationDelay: `${i * 80}ms` };
                return (
                    <div
                        key={i}
                        className="flex items-center gap-3 border-b border-border-subtle py-2.5"
                        style={style}
                    >
                        <Skeleton className="size-7 shrink-0 rounded-md" />
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <Skeleton
                                className="h-3.5"
                                style={{ width: `${42 + (i % 3) * 10}%` }}
                            />
                            <Skeleton
                                className="h-3 opacity-70"
                                style={{ width: `${55 + (i % 2) * 15}%` }}
                            />
                        </div>
                        <Skeleton className="h-3 w-10 shrink-0" />
                    </div>
                );
            })}
        </div>
    );
}
