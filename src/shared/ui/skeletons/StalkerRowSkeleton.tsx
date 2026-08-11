import { Skeleton, SkeletonCircle } from './SkeletonPrimitives';

export function StalkerRowSkeleton() {
    return (
        <tr>
            <td className="border-b border-border-subtle px-5 py-3">
                <SkeletonCircle className="h-8 w-8" />
            </td>
            <td className="border-b border-border-subtle px-5 py-3">
                <Skeleton className="h-4 w-24" />
            </td>
            <td className="border-b border-border-subtle px-5 py-3">
                <Skeleton className="h-3.5 w-20" />
            </td>
            <td className="border-b border-border-subtle px-5 py-3 text-right">
                <Skeleton className="ml-auto h-7 w-14 rounded-md" />
            </td>
        </tr>
    );
}
