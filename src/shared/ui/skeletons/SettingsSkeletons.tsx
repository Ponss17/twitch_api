import { useTranslation } from '@/core/i18n/I18nContext';
import { Skeleton } from './SkeletonPrimitives';

export function SettingsHeroSkeleton() {
    const { t } = useTranslation();
    return (
        <div
            className="relative mb-8 overflow-hidden rounded-xl border border-border-subtle bg-bg-card px-8 py-8 shadow-2xl shadow-black/20 backdrop-blur-xl"
            aria-busy="true"
            aria-label={t.globals.loading.profile}
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

                <div className="flex w-full flex-wrap gap-y-4 border-t border-border-subtle pt-4 xl:w-auto xl:min-w-[29rem] xl:justify-end xl:border-0 xl:pt-0">
                    <div className="flex min-w-[144px] flex-1 items-center gap-3 pr-6 xl:min-w-[160px] xl:flex-none">
                        <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                        <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-2.5 w-16" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    </div>
                    <div className="flex min-w-[144px] flex-1 items-center gap-3 border-l border-border-strong px-6 xl:min-w-[160px] xl:flex-none">
                        <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                        <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-2.5 w-16" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    </div>
                    <div className="flex min-w-[144px] flex-1 items-center gap-3 border-l border-border-strong pl-6 xl:min-w-[160px] xl:flex-none">
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

/** Skeleton del header compacto de Ajustes (avatar + nombre). */
export function SettingsProfileHeaderSkeleton() {
    const { t } = useTranslation();
    return (
        <div className="mb-5" aria-busy="true" aria-label={t.globals.loading.profile}>
            <div className="mb-7 flex gap-4 border-b border-border-subtle pb-0">
                <Skeleton className="mb-2.5 h-5 w-16" />
                <Skeleton className="mb-2.5 h-5 w-14" />
                <Skeleton className="mb-2.5 h-5 w-20" />
                <Skeleton className="mb-2.5 h-5 w-24" />
            </div>
            <div className="space-y-3">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-24 w-full rounded-xl" />
            </div>
        </div>
    );
}

/** Carga de Ajustes sin cabecera de perfil. */
export function SettingsTabsSkeleton() {
    return <SettingsProfileHeaderSkeleton />;
}
