import { useTranslation } from '@/core/i18n/I18nContext';
import { Skeleton } from './SkeletonPrimitives';

export function AnalyticsSkeleton() {
    const { t } = useTranslation();
    return (
        <div className="animate-fade-soft space-y-6" aria-busy="true" aria-label={t.globals.loading.analytics}>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col rounded-xl border border-border-subtle bg-bg-card p-5 h-[100px] justify-between">
                        <div className="flex justify-between items-start">
                            <Skeleton className="h-3 w-20 bg-transparent" />
                            <Skeleton className="h-5 w-5 rounded-md bg-transparent border border-border-subtle" />
                        </div>
                        <Skeleton className="h-6 w-24 bg-transparent" />
                    </div>
                ))}
            </div>
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="flex flex-col rounded-xl border border-border-subtle bg-bg-card lg:col-span-2 h-[350px]">
                    <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
                        <Skeleton className="h-4 w-32 bg-transparent" />
                        <Skeleton className="h-4 w-16 bg-transparent" />
                    </div>
                    <div className="flex-1 p-5 flex flex-col justify-between">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-[1px] w-full bg-border-subtle" />
                        ))}
                        <Skeleton className="h-32 w-full mt-4 bg-gradient-to-t from-primary/[0.03] to-transparent rounded-t-xl" />
                    </div>
                </div>
                
                <div className="flex flex-col rounded-xl border border-border-subtle bg-bg-card h-[350px]">
                    <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-4">
                        <Skeleton className="h-4 w-40 bg-transparent" />
                    </div>
                    <div className="flex-1 p-5 flex flex-col items-center justify-center gap-6">
                        <Skeleton className="h-32 w-32 rounded-full bg-transparent border-[12px] border-border-subtle" />
                        <div className="w-full space-y-2">
                            <Skeleton className="h-2 w-full bg-transparent" />
                            <Skeleton className="h-2 w-4/5 mx-auto bg-transparent" />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="flex flex-col rounded-xl border border-border-subtle bg-bg-card h-[300px]">
                    <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
                        <Skeleton className="h-4 w-32 bg-transparent" />
                        <Skeleton className="h-4 w-12 bg-transparent" />
                    </div>
                    <div className="flex-1 p-5 space-y-5">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full bg-text-main/5" />
                                    <Skeleton className="h-3 w-24 bg-transparent" />
                                </div>
                                <Skeleton className="h-3 w-12 bg-transparent" />
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="flex flex-col rounded-xl border border-border-subtle bg-bg-card h-[300px]">
                    <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-4">
                        <Skeleton className="h-4 w-48 bg-transparent" />
                    </div>
                    <div className="flex-1 p-5 space-y-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2.5">
                                <div className="flex justify-between">
                                    <Skeleton className="h-2.5 w-20 bg-transparent" />
                                    <Skeleton className="h-2.5 w-10 bg-transparent" />
                                </div>
                                <Skeleton className="h-2 w-full rounded-full bg-text-main/5" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
