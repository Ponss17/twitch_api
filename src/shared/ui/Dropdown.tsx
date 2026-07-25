import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type AnchorHTMLAttributes,
    type ButtonHTMLAttributes,
    type HTMLAttributes,
    type InputHTMLAttributes,
    type ReactNode,
    type Ref
} from 'react';
import { ChevronDown } from 'lucide-react';
import { hoverSubtleControl } from '@/core/utils/tw';

interface DropdownContextValue {
    open: boolean;
    setOpen: (open: boolean) => void;
    close: () => void;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdown(): DropdownContextValue {
    const ctx = useContext(DropdownContext);
    if (!ctx) {
        throw new Error('Los componentes Dropdown deben usarse dentro de <Dropdown>.');
    }
    return ctx;
}

export const dropdownTriggerCompact =
    `flex min-w-[9.5rem] max-w-[11.5rem] items-center gap-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 text-[0.8rem] font-medium text-white shadow-lg shadow-black/20 transition-all duration-300 hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#9146ff]/50 disabled:cursor-not-allowed disabled:opacity-50 ${hoverSubtleControl}`;

const panelBase =
    'absolute animate-fade-soft overflow-hidden border border-white/10 bg-[#09090b]/85 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] ring-1 ring-white/5';

interface DropdownProps {
    children: ReactNode;
    className?: string;
}

export function Dropdown({ children, className = 'relative' }: DropdownProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const close = useCallback(() => setOpen(false), []);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                close();
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        document.addEventListener('click', onDocClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('click', onDocClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [close]);

    return (
        <DropdownContext.Provider value={{ open, setOpen, close }}>
            <div ref={containerRef} className={className}>
                {children}
            </div>
        </DropdownContext.Provider>
    );
}

interface DropdownTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    haspopup?: 'menu' | 'listbox';
}

export function DropdownTrigger({
    children,
    className = '',
    disabled,
    haspopup = 'menu',
    onClick,
    ...props
}: DropdownTriggerProps) {
    const { open, setOpen } = useDropdown();

    return (
        <button
            type="button"
            disabled={disabled}
            aria-haspopup={haspopup}
            aria-expanded={open}
            className={className}
            onClick={(e) => {
                if (!disabled) setOpen(!open);
                onClick?.(e);
            }}
            {...props}
        >
            {children}
        </button>
    );
}

interface DropdownChevronProps {
    className?: string;
}

export function DropdownChevron({ className = 'size-4 shrink-0 text-zinc-400 transition-transform duration-300' }: DropdownChevronProps) {
    const { open } = useDropdown();
    return <ChevronDown className={`${className} ${open ? 'rotate-180 text-white' : ''}`} aria-hidden />;
}

interface DropdownPanelProps extends HTMLAttributes<HTMLDivElement> {
    align?: 'left' | 'right';
    placement?: 'top' | 'bottom';
    padding?: 'none' | 'compact';
    zIndex?: 50 | 1000;
    widthClassName?: string;
}

export function DropdownPanel({
    children,
    align = 'right',
    placement = 'bottom',
    padding = 'none',
    zIndex = 50,
    widthClassName = 'min-w-[11.5rem]',
    className = '',
    role = 'menu',
    ...props
}: DropdownPanelProps) {
    const { open } = useDropdown();
    if (!open) return null;

    const zClass = zIndex === 1000 ? 'z-[1000]' : 'z-50';
    const alignClass = align === 'right' ? 'right-0' : 'left-0';
    const placementClass =
        placement === 'top' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]';
    const padClass = padding === 'compact' ? 'p-1.5' : '';

    return (
        <div
            role={role}
            className={`${panelBase} ${zClass} ${alignClass} ${placementClass} ${widthClassName} rounded-xl ${padClass} ${className}`.trim()}
            {...props}
        >
            {children}
        </div>
    );
}

interface DropdownHeaderProps {
    children: ReactNode;
}

export function DropdownHeader({ children }: DropdownHeaderProps) {
    return (
        <div className="border-b border-white/10 bg-white/[0.02] px-4 py-3">
            {typeof children === 'string' ? (
                <span className="text-[0.7rem] font-bold uppercase tracking-wider text-zinc-400">{children}</span>
            ) : (
                children
            )}
        </div>
    );
}

export function DropdownDivider() {
    return <div className="my-1.5 border-t border-white/10" aria-hidden />;
}

interface DropdownItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'danger';
}

export function DropdownItem({
    children,
    className = '',
    variant = 'default',
    onClick,
    ...props
}: DropdownItemProps) {
    const { close } = useDropdown();
    const tone =
        variant === 'danger'
            ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
            : `text-zinc-300 hover:bg-white/10 hover:text-white transition-colors duration-200`;

    return (
        <button
            type="button"
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium transition ${tone} ${className}`.trim()}
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
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-300 no-underline hover:bg-white/10 hover:text-white transition-colors duration-200 ${className}`.trim()}
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
            className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[0.8rem] transition-colors duration-200 hover:bg-white/10 ${
                emphasis ? 'font-semibold text-white' : 'font-medium text-zinc-300 hover:text-white'
            } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`.trim()}
        >
            <input
                ref={inputRef}
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange(e.target.checked)}
                className="size-3.5 accent-[#9146ff]"
                {...inputProps}
            />
            {children}
        </label>
    );
}
