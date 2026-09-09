import { useTranslation } from '@/core/i18n/I18nContext';
import { panelCard } from '@/core/utils/tw';
import { Skeleton } from './SkeletonPrimitives';
import { SettingsGroupSkeleton } from './SectionSkeletons';

/** Mismo layout que `SettingsHero` (Home): saludo + caja de 3 stats. */
export function SettingsHeroSkeleton() {
    const { t } = useTranslation();
    return (
        <section
            className={`relative mb-5 flex flex-col justify-center overflow-hidden ${panelCard} p-6`}
            aria-busy="true"
            aria-label={t.globals.loading.profile}
        >
            <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-2.5">
                        <Skeleton className="size-7 shrink-0 rounded-md md:size-8" />
                        <Skeleton className="h-7 w-52 md:h-8 md:w-64" />
                    </div>
                    <Skeleton className="h-3.5 w-72 max-w-full" />
                </div>

                <div className="flex w-full flex-wrap rounded-xl border border-border-subtle bg-bg-secondary p-4 xl:w-auto xl:min-w-[29rem] xl:justify-end">
                    <div className="flex min-w-[144px] flex-1 items-center gap-3 xl:min-w-[160px] xl:flex-none w-full sm:w-auto sm:pr-6">
                        <Skeleton className="size-10 shrink-0 rounded-lg" />
                        <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-2.5 w-16" />
                            <Skeleton className="h-5 w-20" />
                        </div>
                    </div>
                    <div className="flex min-w-[144px] flex-1 items-center gap-3 xl:min-w-[160px] xl:flex-none w-full border-t border-border-subtle pt-4 sm:w-auto sm:border-l sm:border-t-0 sm:px-6 sm:pt-0">
                        <Skeleton className="size-10 shrink-0 rounded-lg" />
                        <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-2.5 w-16" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    </div>
                    <div className="flex min-w-[144px] flex-1 items-center gap-3 xl:min-w-[160px] xl:flex-none w-full border-t border-border-subtle pt-4 sm:w-auto sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                        <Skeleton className="size-10 shrink-0 rounded-lg" />
                        <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-2.5 w-20" />
                            <Skeleton className="h-5 w-28" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/** Tabs de Ajustes + grupos Nightbot (panel General). */
export function SettingsProfileHeaderSkeleton() {
    const { t } = useTranslation();
    return (
        <div className="w-full" aria-busy="true" aria-label={t.globals.loading.profile}>
            <div
                className="relative mb-7 flex gap-0.5 border-b border-border-subtle"
                role="presentation"
            >
                {[16, 14, 20, 24].map((w, i) => (
                    <Skeleton
                        key={i}
                        className="mb-2.5 h-5"
                        style={{ width: `${w * 0.25}rem`, marginLeft: i === 0 ? 0 : '0.125rem' }}
                    />
                ))}
            </div>
            <SettingsGroupSkeleton rows={2} titleWidth="5rem" descWidth="14rem" />
            <SettingsGroupSkeleton rows={3} titleWidth="7rem" descWidth="12rem" />
        </div>
    );
}

/** Carga de Ajustes sin cabecera de perfil. */
export function SettingsTabsSkeleton() {
    return <SettingsProfileHeaderSkeleton />;
}
