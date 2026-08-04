import { useState, useRef, useEffect, type ElementType } from 'react';
import { toolLabel, toolSelector, hoverNeutralChip, hoverNeutralControl } from '@/core/utils/tw';
import { IconSm } from '@/shared/ui/Icon';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectFieldOption {
    value: string;
    label: string;
}

export interface SelectFieldProps {
    id?: string;
    value?: string;
    onChange?: (e: { target: { value: string } }) => void;
    options: SelectFieldOption[];
    className?: string;
}

/** Dropdown personalizado con estilo unificado del dashboard. */
export function SelectField({ id, options, value, onChange, className = '' }: SelectFieldProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value) || options[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val: string) => {
        onChange?.({ target: { value: val } });
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className={`relative min-w-[180px] w-auto max-w-[min(100%,240px)] shrink-0 ${className}`.trim()}>
            <button
                type="button"
                id={id}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex w-full cursor-pointer appearance-none items-center justify-between rounded-lg border border-border-strong bg-bg-secondary py-[7px] pl-3 pr-2.5 text-[0.8125rem] leading-tight text-text-main outline-none ${hoverNeutralControl} ${isOpen ? 'border-primary/20 bg-primary/[0.02]' : ''} focus:border-primary focus:bg-primary/[0.02]`}
            >
                <span className="truncate">{selectedOption?.label}</span>
                <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full z-[3000] mt-1.5 w-full rounded-xl border border-border-strong bg-bg-modal p-1 shadow-xl animate-fade-soft">
                    <ul className="flex max-h-60 flex-col gap-0.5 overflow-auto [scrollbar-color:var(--border-strong)_transparent] [scrollbar-width:thin]">
                        {options.map((opt) => (
                            <li key={opt.value}>
                                <button
                                    type="button"
                                    onClick={() => handleSelect(opt.value)}
                                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[0.8125rem] ${
                                        opt.value === value 
                                            ? 'bg-primary/10 font-medium text-brand-text' 
                                            : `text-text-muted ${hoverNeutralChip} hover:text-text-main`
                                    }`}
                                >
                                    <span className="truncate">{opt.label}</span>
                                    {opt.value === value && <Check className="h-3.5 w-3.5" />}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
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
