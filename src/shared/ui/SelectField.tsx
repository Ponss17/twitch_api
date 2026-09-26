import {
    useState,
    useRef,
    useEffect,
    useId,
    useLayoutEffect,
    useCallback,
    type ElementType,
    type ReactNode
} from 'react';
import { createPortal } from 'react-dom';
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
    'aria-labelledby'?: string;
    disabled?: boolean;
    name?: string;
    required?: boolean;
}

type MenuPos = { top: number; left: number; width: number; maxHeight: number; openUp: boolean };

/** Dropdown propio: evita el popup nativo (contraste roto en temas oscuros / Windows). */
export function SelectField({
    id,
    options,
    value,
    onChange,
    className = '',
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    disabled = false,
    name,
    required = false
}: SelectFieldProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
    const activeIndexRef = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const listboxId = useId();

    const selectedOption = options.find((opt) => opt.value === value) || options[0];

    const updateMenuPos = () => {
        const btn = buttonRef.current;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const gap = 6;
        const pad = 8;
        const preferredMax = 240;
        const spaceBelow = window.innerHeight - rect.bottom - pad;
        const spaceAbove = rect.top - pad;
        const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
        const maxHeight = Math.min(preferredMax, openUp ? spaceAbove - gap : spaceBelow - gap);
        setMenuPos({
            top: openUp ? rect.top - gap : rect.bottom + gap,
            left: Math.min(rect.left, window.innerWidth - rect.width - pad),
            width: rect.width,
            maxHeight: Math.max(120, maxHeight),
            openUp
        });
    };

    useLayoutEffect(() => {
        if (!isOpen) {
            setMenuPos(null);
            return;
        }
        updateMenuPos();
    }, [isOpen]);

    const focusableIndex = useCallback((from: number, step: number) => {
        if (options.length === 0) return 0;
        let next = from;
        for (let i = 0; i < options.length; i += 1) {
            next = (next + step + options.length) % options.length;
            if (!options[next]?.disabled) return next;
        }
        return from;
    }, [options]);

    const setActive = (index: number) => {
        activeIndexRef.current = index;
        setActiveIndex(index);
    };

    useEffect(() => {
        if (!isOpen) return;
        const current = options.findIndex((opt) => opt.value === (value ?? selectedOption?.value));
        setActive(current >= 0 ? current : focusableIndex(-1, 1));
        // El índice activo lo mueven las flechas; reiniciarlo aquí saltaría la selección.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handlePointer = (event: MouseEvent) => {
            const target = event.target as Node;
            if (containerRef.current?.contains(target)) return;
            if (menuRef.current?.contains(target)) return;
            setIsOpen(false);
        };
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                return;
            }
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActive(focusableIndex(activeIndexRef.current, 1));
                return;
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActive(focusableIndex(activeIndexRef.current, -1));
                return;
            }
            if (event.key === 'Home') {
                event.preventDefault();
                setActive(focusableIndex(-1, 1));
                return;
            }
            if (event.key === 'End') {
                event.preventDefault();
                setActive(focusableIndex(0, -1));
                return;
            }
            if (event.key === 'Enter') {
                const opt = options[activeIndexRef.current];
                if (!opt || opt.disabled) return;
                event.preventDefault();
                onChange?.({ target: { value: opt.value } });
                setIsOpen(false);
            }
        };
        const handleReposition = () => updateMenuPos();

        document.addEventListener('mousedown', handlePointer);
        document.addEventListener('keydown', handleKey);
        window.addEventListener('resize', handleReposition);
        // Capture scroll in sheet/modal parents
        window.addEventListener('scroll', handleReposition, true);
        return () => {
            document.removeEventListener('mousedown', handlePointer);
            document.removeEventListener('keydown', handleKey);
            window.removeEventListener('resize', handleReposition);
            window.removeEventListener('scroll', handleReposition, true);
        };
    }, [isOpen, options, onChange, focusableIndex]);

    const handleSelect = (val: string, optionDisabled?: boolean) => {
        if (optionDisabled) return;
        onChange?.({ target: { value: val } });
        setIsOpen(false);
    };

    const getPortalRoot = (): HTMLElement => {
        const host = containerRef.current?.closest('dialog') ?? document.body;
        return host as HTMLElement;
    };

    const menu =
        isOpen && menuPos && typeof document !== 'undefined'
            ? createPortal(
                  <div
                      ref={menuRef}
                      className="fixed z-[5000] rounded-xl border border-border-strong bg-bg-modal p-1 shadow-xl animate-fade-soft"
                      style={{
                          top: menuPos.openUp ? undefined : menuPos.top,
                          bottom: menuPos.openUp
                              ? window.innerHeight - menuPos.top
                              : undefined,
                          left: menuPos.left,
                          width: menuPos.width,
                          maxHeight: menuPos.maxHeight
                      }}
                  >
                      <ul
                          id={listboxId}
                          role="listbox"
                          aria-label={ariaLabel}
                          className="!m-0 flex !list-none max-h-[inherit] flex-col gap-0.5 overflow-auto !p-0 !pl-0 [scrollbar-color:var(--border-strong)_transparent] [scrollbar-width:thin]"
                          style={{ maxHeight: menuPos.maxHeight - 8 }}
                      >
                          {options.map((opt, index) => {
                              const selected = opt.value === (value ?? selectedOption?.value);
                              const active = index === activeIndex;
                              const optionDisabled = Boolean(opt.disabled);
                              return (
                                  <li
                                      key={opt.value}
                                      role="presentation"
                                      className="!m-0 !list-none !p-0"
                                  >
                                      <button
                                          type="button"
                                          id={`${listboxId}-opt-${index}`}
                                          role="option"
                                          aria-selected={selected}
                                          aria-disabled={optionDisabled}
                                          data-active={active ? 'true' : undefined}
                                          disabled={optionDisabled}
                                          title={opt.title}
                                          onMouseEnter={() => {
                                              if (!optionDisabled) setActive(index);
                                          }}
                                          onClick={() => handleSelect(opt.value, optionDisabled)}
                                          className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[0.8125rem] transition-colors ${
                                              optionDisabled
                                                  ? 'cursor-not-allowed text-text-muted opacity-45'
                                                  : active || selected
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
                  </div>,
                  getPortalRoot()
              )
            : null;

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
                ref={buttonRef}
                type="button"
                id={id}
                disabled={disabled}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-activedescendant={isOpen ? `${listboxId}-opt-${activeIndex}` : undefined}
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
            {menu}
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
    'aria-label': ariaLabel,
    ...selectProps
}: SelectFieldRowProps) {
    const labelId = `${controlId}-label`;
    return (
        <div className={`${toolSelector} ${rowClassName}`.trim()}>
            <div id={labelId} className={toolLabel}>
                <IconSm icon={icon} className="mr-2" />
                <span>{label}</span>
            </div>
            <SelectField
                id={controlId}
                {...selectProps}
                aria-label={ariaLabel ?? label}
                aria-labelledby={labelId}
            />
        </div>
    );
}
