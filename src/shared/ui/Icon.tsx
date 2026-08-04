import type { LucideIcon } from 'lucide-react';
import type { ElementType } from 'react';

type IconProps = {
    icon: LucideIcon | ElementType;
    className?: string;
};

const ICON_BOX = {
    sm: 'size-4',
    md: 'size-5',
    lg: 'size-7'
} as const;

const ICON_INNER = {
    sm: 'size-3.5',
    md: 'size-4',
    lg: 'size-5'
} as const;

function IconSlot({
    icon: Icon,
    size,
    className = ''
}: IconProps & { size: keyof typeof ICON_BOX }) {
    return (
        <span
            className={`inline-flex ${ICON_BOX[size]} shrink-0 items-center justify-center ${className}`.trim()}
            aria-hidden
        >
            <Icon className={ICON_INNER[size]} strokeWidth={2} />
        </span>
    );
}

export function IconSm({ icon, className = '' }: IconProps) {
    return <IconSlot icon={icon} size="sm" className={className} />;
}

export function IconMd({ icon, className = '' }: IconProps) {
    return <IconSlot icon={icon} size="md" className={className} />;
}

export function IconLg({ icon, className = '' }: IconProps) {
    return <IconSlot icon={icon} size="lg" className={className} />;
}

export function InlineIcon({ icon, className = '' }: IconProps) {
    return <IconSlot icon={icon} size="sm" className={className} />;
}

export function EmptyStateIcon({ icon: Icon, className = '' }: IconProps) {
    return (
        <div
            className={`mx-auto mb-3 flex size-14 items-center justify-center rounded-full border border-border-subtle bg-text-main/5 text-text-muted ${className}`.trim()}
        >
            <Icon className="size-7" strokeWidth={2} aria-hidden />
        </div>
    );
}

export function CardHeaderIcon({ icon: Icon }: IconProps) {
    return (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
            <Icon className="size-4" strokeWidth={2} aria-hidden />
        </div>
    );
}
