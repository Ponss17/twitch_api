import { useState, useRef, useEffect, useId, type ElementType } from 'react';
import { toolLabel, toolSelector, hoverSubtleChip, hoverSubtleControl } from '@/core/utils/tw';
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
    'aria-label'?: string;
    disabled?: boolean;
    name?: string;
    required?: boolean;
}

/** Dropdown propio: evita el popup nativo (contraste roto en temas oscuros / Windows). */
export function SelectField({
    id,
    options,
    value,
    onChange,
    className = '',
    'aria-label': ariaLabel,
    disabled = false,
    name,
    required = false
}: SelectFieldProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const listboxId = useId();

    const selectedOption = options.find((opt) => opt.value === value) || options[0];

    useEffect(() => {
        if (!isOpen) return;

        const handlePointer = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('mousedown', handlePointer);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handlePointer);
            document.removeEventListener('keydown', handleKey);
        };
    }, [isOpen]);

    const handleSelect = (val: string) => {
        onChange?.({ target: { value: val } });
        setIsOpen(false);
    };

    return (
        <div
            ref={containerRef}
            className={`relative min-w-[180px] w-auto max-w-[min(100%,240px)] shrink-0 ${className}`.trim()}
        >
            {name ? (
                <input
                    type="hidden"
                    name={name}
                    value={selectedOption?.value ?? ''}
                    required={required}
                    disabled={disabled}
                />
            ) : null}
            <button
                type="button"
                id={id}
                disabled={disabled}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                onClick={() => setIsOpen((open) => !open)}
                className={`flex w-full cursor-pointer appearance-none items-center justify-between rounded-lg border border-border-strong bg-bg-secondary py-[7px] pl-3 pr-2.5 text-[0.8125rem] leading-tight text-text-main outline-none ${hoverSubtleControl} ${isOpen ? 'border-primary/25 bg-primary/[0.08]' : ''} focus:border-primary focus:bg-white/[0.02] disabled:cursor-not-allowed disabled:opacity-50`}
            >
                <span className="truncate">{selectedOption?.label}</span>
                <ChevronDown
                    className={`ml-2 h-4 w-4 shrink-0 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full z-[3000] mt-1.5 w-full rounded-xl border border-border-strong bg-bg-modal p-1 shadow-xl animate-fade-soft">
                    <ul
                        id={listboxId}
                        role="listbox"
                        aria-label={ariaLabel}
                        className="flex max-h-60 flex-col gap-0.5 overflow-auto [scrollbar-color:var(--border-strong)_transparent] [scrollbar-width:thin]"
                    >
                        {options.map((opt) => {
                            const selected = opt.value === (value ?? selectedOption?.value);
                            return (
                                <li key={opt.value} role="presentation">
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={selected}
                                        onClick={() => handleSelect(opt.value)}
                                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[0.8125rem] transition-colors ${
                                            selected
                                                ? 'bg-primary/[0.08] font-medium text-brand-text hover:bg-primary/[0.08]'
                                                : `text-text-muted ${hoverSubtleChip} hover:text-text-main`
                                        }`}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                        {selected && <Check className="h-3.5 w-3.5" />}
                                    </button>
                                </li>
                            );
                        })}
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
