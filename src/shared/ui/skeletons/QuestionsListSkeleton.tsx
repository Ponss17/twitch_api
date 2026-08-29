import { Skeleton, SkeletonCircle } from './SkeletonPrimitives';

function QuestionItemSkeleton({ delay }: { delay: string }) {
    return (
        <li
            className="rounded-xl border border-border-subtle bg-bg-overlay px-4 py-3"
            style={{ animationDelay: delay }}
        >
            <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-3 w-10 opacity-60" />
                    </div>
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-3/4" />
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <SkeletonCircle className="h-7 w-7" />
                    <SkeletonCircle className="h-7 w-7" />
                </div>
            </div>
        </li>
    );
}

export function QuestionsListSkeleton() {
    return (
        <div className="rounded-xl border border-border-subtle bg-bg-overlay/30 p-4">
            <ul className="flex flex-col gap-2">
                <QuestionItemSkeleton delay="0ms" />
                <QuestionItemSkeleton delay="80ms" />
                <QuestionItemSkeleton delay="160ms" />
            </ul>
        </div>
    );
}
