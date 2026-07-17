import type { LucideIcon } from 'lucide-react';
import { forwardRef, type ReactNode } from 'react';
import { card, fadeIn } from '@/core/utils/tw';

type Accent = 'primary' | 'error';

const ACCENTS: Record<Accent, { iconWrap: string; divider: string; title: string; shell: string }> = {
    primary: {
        iconWrap: 'border-primary/20 bg-primary/10 text-primary',
        divider: 'border-white/[0.08]',
        title: 'text-[#fafafa]',
        shell: ''
    },
    error: {
        iconWrap: 'border-error/25 bg-error/10 text-error',
        divider: 'border-error/15',
        title: 'text-error',
        shell: '!border-error/30 hover:!border-error/60'
    }
};

interface SettingsGroupProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    accent?: Accent;
    delay?: number;
    action?: ReactNode;
    children: ReactNode;
}

/** Bloque de configuración: una card con cabecera y filas separadas por divisores. */
export const SettingsGroup = forwardRef<HTMLDivElement, SettingsGroupProps>(function SettingsGroup(
    { icon: Icon, title, description, accent = 'primary', delay = 0, action, children },
    ref
) {
    const a = ACCENTS[accent];
    return (
        <section
            ref={ref}
            className={`${card} ${fadeIn} mb-4 opacity-0 ${a.shell}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`mb-1 flex items-center justify-between gap-3 border-b ${a.divider} pb-3`}>
                <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${a.iconWrap}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className={`text-[0.95rem] font-bold ${a.title}`}>{title}</h3>
                        {description ? <p className="text-[0.8rem] text-[#c4c4cc]">{description}</p> : null}
                    </div>
                </div>
                {action}
            </div>
            <div className={`divide-y ${a.divider}`}>{children}</div>
        </section>
    );
});

interface SettingsRowProps {
    title?: string;
    description?: ReactNode;
    icon?: LucideIcon;
    /** Control alineado a la derecha (botón, dropdown, badge...). */
    control?: ReactNode;
    /** Contenido a ancho completo (inputs, bloques). Se apila bajo el título si lo hay. */
    children?: ReactNode;
    accent?: Accent;
}

/** Fila dentro de un SettingsGroup: texto a la izquierda, control a la derecha. */
export function SettingsRow({ title, description, icon: Icon, control, children, accent = 'primary' }: SettingsRowProps) {
    const iconColor = accent === 'error' ? 'text-error' : 'text-primary';
    return (
        <div className="py-4 first:pt-4 last:pb-1">
            {title || description || control ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {title || description ? (
                        <div className="min-w-0 flex-1">
                            {title ? (
                                <h4 className={`mb-0.5 flex items-center gap-2 text-[0.95rem] font-bold text-white`}>
                                    {Icon ? <Icon className={`h-4 w-4 ${iconColor}`} aria-hidden="true" /> : null}
                                    {title}
                                </h4>
                            ) : null}
                            {description ? (
                                <p className="max-w-[600px] text-[0.82rem] leading-relaxed text-[#c4c4cc]">{description}</p>
                            ) : null}
                        </div>
                    ) : null}
                    {control ? <div className="w-full shrink-0 sm:w-auto">{control}</div> : null}
                </div>
            ) : null}
            {children ? <div className={title || description ? 'mt-3' : ''}>{children}</div> : null}
        </div>
    );
}
