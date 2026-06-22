import type { ReactNode } from 'react';
import { card, fadeIn } from '@/lib/tw';

interface DashboardCardProps {
    children: ReactNode;
    className?: string;
    delayMs?: number;
}

interface DashboardCardHeaderProps {
    icon?: string;
    title: string;
    description?: ReactNode;
    actions?: ReactNode;
    mini?: boolean;
}

export function DashboardCard({ children, className = '', delayMs = 0 }: DashboardCardProps) {
    return (
        <div
            className={`${card} ${fadeIn} mb-3 ${className}`}
            style={{ animationDelay: `${delayMs}ms` }}
        >
            {children}
        </div>
    );
}

export function DashboardCardHeader({
    icon,
    title,
    description,
    actions,
    mini
}: DashboardCardHeaderProps) {
    if (mini) {
        return (
            <div className="mb-2 border-b border-white/[0.08] pb-2">
                <h3 className="text-[0.95rem] font-bold">{title}</h3>
            </div>
        );
    }

    return (
        <div className="mb-2 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#9146ff]/20 bg-[#9146ff]/10 text-sm text-[#9146ff]">
                        <i className={`fa-solid ${icon}`} aria-hidden />
                    </div>
                )}
                <div>
                    <h3 className="text-[0.95rem] font-bold">{title}</h3>
                    {description && <p className="text-[0.8rem] text-[#a1a1aa]">{description}</p>}
                </div>
            </div>
            {actions}
        </div>
    );
}

export function DashboardCardBody({
    children,
    className = ''
}: {
    children: ReactNode;
    className?: string;
}) {
    return <div className={`text-[#fafafa] ${className}`}>{children}</div>;
}
