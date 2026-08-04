import type { LucideIcon } from 'lucide-react';
import { forwardRef, type ReactNode } from 'react';
import { fadeIn } from '@/core/utils/tw';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { subtleIcon, type SubtleAccent } from '@/features/dashboard/lib/subtleAccents';

type Accent = 'primary' | 'error';

/** Título de sección estilo Nightbot: texto suelto, sin card envolvente. */
export const SettingsGroup = forwardRef<
    HTMLDivElement,
    {
        title: string;
        description?: string;
        accent?: Accent;
        delay?: number;
        action?: ReactNode;
        children: ReactNode;
        /** @deprecated ya no se muestra; se mantiene por compatibilidad */
        icon?: LucideIcon;
        /** @deprecated ya no se muestra; se mantiene por compatibilidad */
        iconAccent?: SubtleAccent;
    }
>(function SettingsGroup({ title, description, accent = 'primary', delay = 0, action, children }, ref) {
    const titleColor = accent === 'error' ? 'text-error' : 'text-text-main';
    return (
        <section ref={ref} className={`${fadeIn} mb-8 opacity-0`} style={{ animationDelay: `${delay}ms` }}>
            <header className="mb-3 flex items-end justify-between gap-3">
                <div>
                    <h2 className={`text-[1.15rem] font-bold tracking-tight ${titleColor}`}>{title}</h2>
                    {description ? (
                        <p className="mt-0.5 text-[0.8rem] leading-relaxed text-text-muted">{description}</p>
                    ) : null}
                </div>
                {action}
            </header>
            <div className="flex flex-col gap-2.5">{children}</div>
        </section>
    );
});

interface SettingsRowProps {
    title?: string;
    description?: ReactNode;
    icon?: LucideIcon;
    iconNode?: ReactNode;
    /** Clases del contenedor del icono (borde/fondo/color). Sobrescribe el accent. */
    iconClass?: string;
    iconAccent?: SubtleAccent;
    /** Tooltip de ayuda alineado a la derecha de la fila. */
    info?: ReactNode;
    /** Control alineado a la derecha (botón, dropdown, badge...). */
    control?: ReactNode;
    /** Contenido a ancho completo (inputs, bloques). Se apila bajo el título si lo hay. */
    children?: ReactNode;
    accent?: Accent;
}

/**
 * Fila-panel estilo Nightbot Settings:
 * [icono] título + descripción ............. control
 * contenido opcional debajo (inputs, etc.)
 */
export function SettingsRow({
    title,
    description,
    icon: Icon,
    iconNode,
    iconClass,
    iconAccent,
    info,
    control,
    children,
    accent = 'primary'
}: SettingsRowProps) {
    const isError = accent === 'error';
    const iconWrap =
        iconClass ??
        (iconAccent
            ? subtleIcon(iconAccent)
            : isError
              ? subtleIcon('error')
              : subtleIcon('primary'));
    const shell = isError
        ? 'border-error/20 bg-error/[0.04]'
        : 'border-border-subtle bg-bg-card shadow-sm';

    const resolvedIcon =
        iconNode ??
        (Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null);

    return (
        <div className={`rounded-xl border px-4 py-3.5 ${shell}`}>
            {title || description || control || resolvedIcon ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                        {resolvedIcon ? (
                            <div
                                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${iconWrap}`}
                            >
                                {resolvedIcon}
                            </div>
                        ) : null}
                        <div className="min-w-0 pt-0.5">
                            {title ? (
                                <h3 className="text-[0.9rem] font-semibold text-text-main">{title}</h3>
                            ) : null}
                            {description ? (
                                <p className="mt-0.5 max-w-xl text-[0.8rem] leading-relaxed text-text-muted">
                                    {description}
                                </p>
                            ) : null}
                        </div>
                    </div>
                    {control || info ? (
                        <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto sm:pl-2">
                            {control}
                            {info ? <InfoTooltip text={info} placement="bottom" /> : null}
                        </div>
                    ) : null}
                </div>
            ) : null}
            {children ? <div className={title || description || resolvedIcon ? 'mt-3' : ''}>{children}</div> : null}
        </div>
    );
}
