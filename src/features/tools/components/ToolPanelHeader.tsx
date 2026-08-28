import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { ToolFocusExitButton } from '@/features/dashboard/layout/ToolFocusExitButton';
import { subtleIcon } from '@/features/dashboard/lib/ui/subtleAccents';
import { toolHeaderConfigBar, toolHeaderTopRow } from '@/core/utils/tw';
import { useToolFocus } from '@/features/dashboard/lib/ui/ToolFocusContext';

interface ToolPanelHeaderProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    status?: ReactNode;
    primaryAction?: ReactNode;
    config?: ReactNode;
    trailing?: ReactNode;
}

export function ToolPanelHeader({
    icon: Icon,
    title,
    description,
    status,
    primaryAction,
    config,
    trailing
}: ToolPanelHeaderProps) {
    const { focusMode } = useToolFocus();
    const showConfigBar = Boolean(config || trailing);

    return (
        <header className="shrink-0 border-b border-border-subtle">
            <div className={toolHeaderTopRow}>
                <div className="flex min-w-0 items-center gap-3">
                    <ToolFocusExitButton />
                    <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg border ${subtleIcon('primary')}`}
                    >
                        <Icon className="size-4" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <h2 className="truncate text-[0.9375rem] font-semibold tracking-tight text-text-main">
                            {title}
                        </h2>
                        {focusMode && description ? (
                            <p className="mt-0.5 truncate text-[0.75rem] leading-snug text-text-muted">
                                {description}
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {status}
                    {primaryAction}
                </div>
            </div>

            {showConfigBar ? (
                <div className={toolHeaderConfigBar}>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{config}</div>
                    {trailing ? (
                        <div className="flex shrink-0 flex-wrap items-center gap-1.5">{trailing}</div>
                    ) : null}
                </div>
            ) : null}
        </header>
    );
}
