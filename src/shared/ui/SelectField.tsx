import type { ElementType, SelectHTMLAttributes } from 'react';
import { selectInput, toolLabel, toolSelector } from '@/core/ui/tw';
import { IconSm } from '@/shared/ui/Icon';

export interface SelectFieldOption {
    value: string;
    label: string;
}

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
    options: SelectFieldOption[];
    className?: string;
}

const optionClassName = 'bg-bg-card text-[#fafafa]';

/** `<select>` nativo con estilo unificado del dashboard. */
export function SelectField({ options, className = '', ...props }: SelectFieldProps) {
    return (
        <select className={`${selectInput} ${className}`.trim()} {...props}>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value} className={optionClassName}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}

export interface SelectFieldRowProps extends SelectFieldProps {
    label: string;
    icon: ElementType;
    controlId: string;
    rowClassName?: string;
}

/** Fila label + select (Comandos y similares). */
export function SelectFieldRow({
    label,
    icon,
    controlId,
    rowClassName = '',
    ...selectProps
}: SelectFieldRowProps) {
    return (
        <div className={`${toolSelector} ${rowClassName}`.trim()}>
            <label htmlFor={controlId} className={toolLabel}>
                <IconSm icon={icon} className="mr-2" />
                <span>{label}</span>
            </label>
            <SelectField id={controlId} {...selectProps} />
        </div>
    );
}
