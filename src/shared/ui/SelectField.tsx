import { useState, useRef, useEffect, useId, type ElementType, type ReactNode } from 'react';
import { toolLabel, toolSelector, hoverSubtleChip, hoverSubtleControl } from '@/core/utils/tw';
import { IconSm } from '@/shared/ui/Icon';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectFieldOption {
    value: string;
    label: string;
    icon?: ReactNode;
    disabled?: boolean;
    title?: string;
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

    const handleSelect = (val: string, optionDisabled?: boolean) => {
        if (optionDisabled) return;
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
                <span className="flex min-w-0 items-center gap-2">
                    {selectedOption?.icon ? (
                        <span className="flex shrink-0 items-center text-text-muted [&_svg]:size-3.5">
                            {selectedOption.icon}
                        </span>
                    ) : null}
                    <span className="truncate">{selectedOption?.label}</span>
                </span>
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
                        className="!m-0 flex !list-none max-h-60 flex-col gap-0.5 overflow-auto !p-0 !pl-0 [scrollbar-color:var(--border-strong)_transparent] [scrollbar-width:thin]"
                    >
                        {options.map((opt) => {
                            const selected = opt.value === (value ?? selectedOption?.value);
                            const optionDisabled = Boolean(opt.disabled);
                            return (
                                <li key={opt.value} role="presentation" className="!list-none !m-0 !p-0">
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={selected}
                                        aria-disabled={optionDisabled}
                                        disabled={optionDisabled}
                                        title={opt.title}
                                        onClick={() => handleSelect(opt.value, optionDisabled)}
                                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[0.8125rem] transition-colors ${
                                            optionDisabled
                                                ? 'cursor-not-allowed opacity-45 text-text-muted'
                                                : selected
                                                  ? 'bg-primary/[0.08] font-medium text-text-main hover:bg-primary/[0.08]'
                                                  : `text-text-muted ${hoverSubtleChip} hover:text-text-main`
                                        }`}
                                    >
                                        <span className="flex min-w-0 items-center gap-2">
                                            {opt.icon ? (
                                                <span
                                                    className={`flex shrink-0 items-center [&_svg]:size-3.5 ${
                                                        selected && !optionDisabled
                                                            ? 'text-primary'
                                                            : 'text-text-muted'
                                                    }`}
                                                >
                                                    {opt.icon}
                                                </span>
                                            ) : null}
                                            <span className="truncate">{opt.label}</span>
                                        </span>
                                        {selected && !optionDisabled && (
                                            <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                                        )}
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
