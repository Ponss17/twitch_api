import {
    createContext,
    useContext,
    type ReactNode
} from 'react';
import { AnimatedToastStack, useAnimatedToastStack, type ToastStatus } from './animated-toast-stack';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';
type ToastId = string | number;

interface ToastPromiseMessages<T> {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: unknown) => string);
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType, id?: ToastId) => ToastId;
    dismissToast: (id?: ToastId) => void;
    showToastPromise: <T>(promise: Promise<T>, messages: ToastPromiseMessages<T>) => Promise<T>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_POPOVER_ATTR = 'data-app-toaster-popover';

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

// AppToaster ya no hace falta porque lo renderizamos en ToastProvider. 
// Dejamos un wrapper vacío para que no rompa el JSX donde está importado (DashboardApp.tsx).
export function AppToaster() {
    return null;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const { toasts, showToast: baseShowToast, dismissToast: baseDismissToast, updateToast } = useAnimatedToastStack({
        defaultDuration: 4000,
        limit: 5,
    });

    const showToast = (message: string, type: ToastType = 'info', id?: ToastId): ToastId => {
        promoteToasterAboveModals();
        let status: ToastStatus = 'info';
        if (type === 'success' || type === 'error' || type === 'loading') {
            status = type;
        } else if (type === 'warning') {
            status = 'error'; // map warning to error
        }
        
        return baseShowToast({
            id: id ? String(id) : undefined,
            title: message,
            status,
        });
    };

    const dismissToast = (id?: ToastId) => {
        if (id !== undefined) {
            baseDismissToast(String(id));
        } else {
            // Dismiss all is not supported by base API unless we clear, let's ignore if no id provided
            // or we could add clearToasts. For now just do nothing.
        }
    };

    const showToastPromise = <T,>(
        promise: Promise<T>,
        messages: ToastPromiseMessages<T>
    ): Promise<T> => {
        promoteToasterAboveModals();
        const id = showToast(messages.loading, 'loading');
        
        promise
            .then(data => {
                updateToast(String(id), {
                    title: typeof messages.success === 'function' ? messages.success(data) : messages.success,
                    status: 'success',
                    duration: 4000
                });
            })
            .catch(err => {
                updateToast(String(id), {
                    title: typeof messages.error === 'function' ? messages.error(err) : messages.error,
                    status: 'error',
                    duration: 4000
                });
            });
            
        return promise;
    };

    return (
        <ToastContext.Provider value={{ showToast, dismissToast, showToastPromise }}>
            {children}
            <div 
                {...{ [TOAST_POPOVER_ATTR]: '' }} 
                popover="manual" 
                className="pointer-events-none fixed inset-0 z-[100] h-dvh w-screen m-0 border-0 bg-transparent p-0"
                ref={el => {
                    if (el && typeof el.showPopover === 'function') {
                        try { el.showPopover(); } catch { /* ignore */ }
                    }
                }}
            >
                <AnimatedToastStack 
                    toasts={toasts} 
                    onDismiss={baseDismissToast} 
                    position="bottom-right" 
                    fixed={true} 
                    maxVisible={4}
                    classNames={{
                        surface: "!bg-bg-modal !border-border-strong !shadow-xl",
                        title: "!text-text-main",
                        description: "!text-text-muted"
                    }}
                />
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

const noopToast = () => '' as ToastId;

export function useToastOptional() {
    const ctx = useContext(ToastContext);
    return ctx?.showToast ?? noopToast;
}
