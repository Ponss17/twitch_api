import type { LucideIcon } from 'lucide-react';
import { forwardRef, type ReactNode } from 'react';
import { fadeIn } from '@/core/utils/tw';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { subtleIcon, type SubtleAccent } from '@/features/dashboard/lib/subtleAccents';

type Accent = 'primary' | 'error';

/**
 * Sección estilo Nightbot: título suelto + una sola lista con divisores.
 * Los hijos (aunque vengan en Fragment) se aplanan en el DOM → `divide-y` funciona.
 */
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
        <section ref={ref} className={`${fadeIn} mb-9 opacity-0`} style={{ animationDelay: `${delay}ms` }}>
            <header className="mb-2.5 flex items-end justify-between gap-3 px-0.5">
                <div>
                    <h2 className={`text-[0.95rem] font-semibold tracking-tight ${titleColor}`}>{title}</h2>
                    {description ? (
                        <p className="mt-0.5 text-[0.78rem] leading-relaxed text-text-muted">{description}</p>
                    ) : null}
                </div>
                {action}
            </header>
            <div
                className={`divide-y rounded-lg border bg-bg-card [&>*:first-child]:rounded-t-[calc(0.5rem-1px)] [&>*:last-child]:rounded-b-[calc(0.5rem-1px)] ${
                    accent === 'error'
                        ? 'divide-error/15 border-error/25'
                        : 'divide-border-subtle border-border-subtle'
                }`}
            >
                {children}
            </div>
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
 * Fila plana estilo Nightbot:
 * [icono] título + descripción ......................... control
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

    const resolvedIcon =
        iconNode ?? (Icon ? <Icon className="h-[1.05rem] w-[1.05rem]" aria-hidden="true" /> : null);

    return (
        <div className={`px-4 py-3.5 sm:px-5 ${isError ? 'bg-error/[0.03]' : ''}`}>
            {title || description || control || resolvedIcon ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
                    <div className="flex min-w-0 flex-1 items-center gap-3.5">
                        {resolvedIcon ? (
                            <div
                                className={`flex size-8 shrink-0 items-center justify-center rounded-md border ${iconWrap}`}
                            >
                                {resolvedIcon}
                            </div>
                        ) : null}
                        <div className="min-w-0">
                            {title ? (
                                <h3 className="text-[0.875rem] font-medium text-text-main">{title}</h3>
                            ) : null}
                            {description ? (
                                <p className="mt-0.5 max-w-xl text-[0.78rem] leading-snug text-text-muted">
                                    {description}
                                </p>
                            ) : null}
                        </div>
                    </div>
                    {control || info ? (
                        <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto sm:max-w-[min(100%,28rem)]">
                            {control}
                            {info ? <InfoTooltip text={info} placement="bottom" /> : null}
                        </div>
                    ) : null}
                </div>
            ) : null}
            {children ? (
                <div className={title || description || resolvedIcon ? 'mt-3' : ''}>{children}</div>
            ) : null}
        </div>
    );
}
