import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ButtonHTMLAttributes,
    type ReactNode,
    type RefObject
} from 'react';
import { ChevronDown } from 'lucide-react';
import { hoverSubtleControl } from '@/core/utils/tw';

interface DropdownContextValue {
    open: boolean;
    setOpen: (open: boolean) => void;
    close: () => void;
    containerRef: RefObject<HTMLDivElement | null>;
    panelRef: RefObject<HTMLDivElement | null>;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

export function useDropdown(): DropdownContextValue {
    const ctx = useContext(DropdownContext);
    if (!ctx) {
        throw new Error('Los componentes Dropdown deben usarse dentro de <Dropdown>.');
    }
    return ctx;
}

export const dropdownTriggerCompact =
    `flex min-w-[9.5rem] max-w-[11.5rem] items-center gap-2 rounded-lg border border-border-strong bg-text-main/5 px-2.5 py-1.5 text-[0.75rem] font-medium text-text-main transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${hoverSubtleControl} aria-expanded:border-primary/25 aria-expanded:bg-primary/[0.08]`;

interface DropdownProps {
    children: ReactNode;
    className?: string;
}

export function Dropdown({ children, className = 'relative' }: DropdownProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const close = useCallback(() => setOpen(false), []);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (containerRef.current?.contains(target)) return;
            if (panelRef.current?.contains(target)) return;
            close();
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
        <DropdownContext.Provider value={{ open, setOpen, close, containerRef, panelRef }}>
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

export function DropdownChevron({ className = 'size-3.5 shrink-0 text-text-muted transition-transform' }: DropdownChevronProps) {
    const { open } = useDropdown();
    return <ChevronDown className={`${className} ${open ? 'rotate-180' : ''}`} aria-hidden />;
}
