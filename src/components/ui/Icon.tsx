import type { LucideIcon } from 'lucide-react';
import type { ElementType } from 'react';
import { ICON_LG, ICON_MD, ICON_SM } from '@/lib/dashboardTabs';

type IconProps = {
    icon: LucideIcon | ElementType;
    className?: string;
};

export function IconSm({ icon: Icon, className = '' }: IconProps) {
    return <Icon className={`${ICON_SM} ${className}`.trim()} aria-hidden />;
}

export function IconMd({ icon: Icon, className = '' }: IconProps) {
    return <Icon className={`${ICON_MD} ${className}`.trim()} aria-hidden />;
}

export function InlineIcon({ icon: Icon, className = '' }: IconProps) {
    return <Icon className={`${ICON_SM} inline-block align-[-0.125em] ${className}`.trim()} aria-hidden />;
}

export function EmptyStateIcon({ icon: Icon, className = '' }: IconProps) {
    return (
        <div
            className={`mx-auto mb-3 flex size-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#a1a1aa] ${className}`.trim()}
        >
            <Icon className={ICON_LG} aria-hidden />
        </div>
    );
}

export function CardHeaderIcon({ icon: Icon }: IconProps) {
    return (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
            <Icon className={ICON_SM} aria-hidden />
        </div>
    );
}
