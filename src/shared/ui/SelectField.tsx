import type { ElementType, SelectHTMLAttributes } from 'react';
import { toolLabel, toolSelector, hoverNeutralControl } from '@/core/utils/tw';
import { IconSm } from '@/shared/ui/Icon';

export interface SelectFieldOption {
    value: string;
    label: string;
}

export interface SelectFieldProps
    extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
    options: SelectFieldOption[];
}

export function SelectField({ options, className = '', ...selectProps }: SelectFieldProps) {
    return (
        <select
            {...selectProps}
            className={`min-w-[180px] w-auto max-w-[min(100%,240px)] shrink-0 cursor-pointer rounded-lg border border-border-strong bg-bg-secondary py-[7px] pl-3 pr-8 text-[0.8125rem] leading-tight text-text-main outline-none ${hoverNeutralControl} focus:border-primary focus:bg-primary/[0.02] ${className}`.trim()}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
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
