import { useTranslation } from '@/core/i18n/I18nContext';
import { panelCard } from '@/core/utils/tw';
import { Skeleton } from './SkeletonPrimitives';
import { ToolPanelHeaderSkeleton } from './SectionSkeletons';

/** Shell de Ruleta Bits: header + Disparo | Premios + acciones. */
export function BitsRouletteSkeleton() {
    const { t } = useTranslation();
    return (
        <div
            className={`${panelCard} mb-3 flex animate-fade-soft flex-col`}
            aria-busy="true"
            aria-label={t.globals.loading.bitsRoulette}
        >
            <ToolPanelHeaderSkeleton withConfigBar={false} />
            <div className="flex flex-col gap-6 p-5">
                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="space-y-4 rounded-xl border border-border-subtle bg-bg-secondary/40 p-4">
                        <Skeleton className="h-4 w-20" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="size-4 shrink-0 rounded" />
                            <Skeleton className="h-3.5 w-28" />
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <div className="space-y-1.5">
                                <Skeleton className="h-2.5 w-10" />
                                <Skeleton className="h-8 w-28 rounded-lg" />
                            </div>
                            <div className="space-y-1.5">
                                <Skeleton className="h-2.5 w-12" />
                                <Skeleton className="h-8 w-44 rounded-lg" />
                            </div>
                            <div className="space-y-1.5">
                                <Skeleton className="h-2.5 w-16" />
                                <Skeleton className="h-8 w-24 rounded-lg" />
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Skeleton className="mt-0.5 size-4 shrink-0 rounded" />
                            <div className="min-w-0 flex-1 space-y-1.5">
                                <Skeleton className="h-3.5 w-52 max-w-full" />
                                <Skeleton className="h-2.5 w-64 max-w-full" />
                            </div>
                        </div>
                        <Skeleton className="h-2.5 w-full max-w-md" />
                    </section>

                    <section className="space-y-3 rounded-xl border border-border-subtle bg-bg-secondary/40 p-4">
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 space-y-1.5">
                                <Skeleton className="h-4 w-36" />
                                <Skeleton className="h-2.5 w-40" />
                            </div>
                            <Skeleton className="h-7 w-16 rounded-lg" />
                        </div>
                        <ul className="space-y-2">
                            {[0, 1, 2].map((i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <Skeleton className="h-8 flex-1 rounded-lg" />
                                    <Skeleton className="size-8 shrink-0 rounded-lg" />
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-9 w-32 rounded-lg" />
                    <Skeleton className="h-9 w-36 rounded-lg" />
                </div>
            </div>
        </div>
    );
}
