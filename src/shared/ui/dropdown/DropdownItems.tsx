import {
    type AnchorHTMLAttributes,
    type ButtonHTMLAttributes,
    type InputHTMLAttributes,
    type ReactNode,
    type Ref
} from 'react';
import { hoverSubtleChip } from '@/core/utils/tw';
import { useDropdown } from './DropdownContext';

interface DropdownHeaderProps {
    children: ReactNode;
}

export function DropdownHeader({ children }: DropdownHeaderProps) {
    return (
        <div className="border-b border-border-subtle px-4 py-3">
            {typeof children === 'string' ? (
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">{children}</span>
            ) : (
                children
            )}
        </div>
    );
}

export function DropdownDivider() {
    return <div className="my-1 border-t border-border-subtle" aria-hidden />;
}

interface DropdownItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'danger';
    /** Opción seleccionada / activa — mismo morado que el historial. */
    active?: boolean;
}

export function DropdownItem({
    children,
    className = '',
    variant = 'default',
    active = false,
    onClick,
    ...props
}: DropdownItemProps) {
    const { close } = useDropdown();
    const tone =
        variant === 'danger'
            ? 'text-error hover:bg-error/10'
            : active
              ? 'bg-primary/[0.08] font-semibold text-brand-text hover:bg-primary/[0.08]'
              : `text-text-muted ${hoverSubtleChip} hover:text-text-main`;

    return (
        <button
            type="button"
            aria-current={active ? 'true' : undefined}
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium transition-colors ${tone} ${className}`.trim()}
            onClick={(e) => {
                close();
                onClick?.(e);
            }}
            {...props}
        >
            {children}
        </button>
    );
}

interface DropdownLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    closeOnClick?: boolean;
}

export function DropdownLink({
    children,
    className = '',
    closeOnClick = false,
    onClick,
    ...props
}: DropdownLinkProps) {
    const { close } = useDropdown();

    return (
        <a
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-muted no-underline ${hoverSubtleChip} hover:text-text-main ${className}`.trim()}
            onClick={(e) => {
                if (closeOnClick) close();
                onClick?.(e);
            }}
            {...props}
        >
            {children}
        </a>
    );
}

interface DropdownCheckboxItemProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    children: ReactNode;
    disabled?: boolean;
    emphasis?: boolean;
    inputRef?: Ref<HTMLInputElement>;
    inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'onChange' | 'disabled'>;
}

export function DropdownCheckboxItem({
    checked,
    onChange,
    children,
    disabled = false,
    emphasis = false,
    inputRef,
    inputProps
}: DropdownCheckboxItemProps) {
    return (
        <label
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-[0.75rem] ${hoverSubtleChip} ${emphasis ? 'font-semibold text-text-main' : 'font-medium text-text-muted hover:text-text-main'
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`.trim()}
        >
            <input
                ref={inputRef}
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange(e.target.checked)}
                className="size-3.5 accent-primary"
                {...inputProps}
            />
            {children}
        </label>
    );
}
