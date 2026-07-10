import { useState, useRef, useEffect, type ElementType } from 'react';
import { toolLabel, toolSelector } from '@/core/utils/tw';
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
                className="flex w-full cursor-pointer appearance-none items-center justify-between rounded-lg border border-white/[0.08] bg-bg-secondary py-[7px] pl-3 pr-2.5 text-[0.8125rem] leading-tight text-[#fafafa] outline-none transition hover:border-white/20 focus:border-primary focus:bg-primary/[0.02]"
            >
                <span className="truncate">{selectedOption?.label}</span>
                <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full z-[3000] mt-1.5 w-full overflow-hidden rounded-lg border border-white/[0.08] bg-[#0f0f11] shadow-xl animate-fade-soft">
                    <ul className="max-h-60 overflow-auto py-1 [scrollbar-color:rgba(255,255,255,0.08)_transparent] [scrollbar-width:thin]">
                        {options.map((opt) => (
                            <li key={opt.value}>
                                <button
                                    type="button"
                                    onClick={() => handleSelect(opt.value)}
                                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-[0.8125rem] transition-colors ${
                                        opt.value === value 
                                            ? 'bg-primary/10 font-medium text-primary' 
                                            : 'text-[#c4c4cc] hover:bg-white/5 hover:text-[#fafafa]'
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
