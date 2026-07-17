import {
    createContext,
    useContext,
    useEffect,
    useRef,
    type ReactNode
} from 'react';
import { Toaster, toast as sonnerToast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_POPOVER_ATTR = 'data-app-toaster-popover';

/**
 * Los `<dialog showModal()>` viven en la top layer del browser;
 * un z-index normal nunca queda por encima. Re-promovemos el popover
 * del toaster para que el toast se vea encima del modal.
 */
export function promoteToasterAboveModals(): void {
    if (typeof document === 'undefined') return;
    const el = document.querySelector<HTMLElement>(`[${TOAST_POPOVER_ATTR}]`);
    if (!el || typeof el.showPopover !== 'function') return;
    try {
        if (el.matches(':popover-open')) el.hidePopover();
        el.showPopover();
    } catch {
        try {
            el.showPopover();
        } catch {
            /* popover no soportado */
        }
    }
}

/** Toaster en top layer (popover) para quedar sobre modales nativos. */
export function AppToaster() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof el.showPopover !== 'function') return;
        try {
            el.showPopover();
        } catch {
            /* ignore */
        }
    }, []);

    return (
        <div
            ref={ref}
            {...{ [TOAST_POPOVER_ATTR]: '' }}
            popover="manual"
            className="app-toaster-popover pointer-events-none m-0 h-dvh w-screen max-h-none max-w-none border-0 bg-transparent p-0"
        >
            <Toaster
                theme="dark"
                richColors
                position="bottom-right"
                style={{ zIndex: 1, pointerEvents: 'auto' }}
                toastOptions={{
                    style: { pointerEvents: 'auto' }
                }}
            />
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const showToast = (message: string, type: ToastType = 'info') => {
        promoteToasterAboveModals();
        switch (type) {
            case 'success':
                sonnerToast.success(message);
                break;
            case 'error':
                sonnerToast.error(message);
                break;
            case 'warning':
                sonnerToast.warning(message);
                break;
            case 'info':
            default:
                sonnerToast.info(message);
                break;
        }
    };

    return <ToastContext.Provider value={{ showToast }}>{children}</ToastContext.Provider>;
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

const noopToast = () => {};

export function useToastOptional() {
    const ctx = useContext(ToastContext);
    return ctx?.showToast ?? noopToast;
}
