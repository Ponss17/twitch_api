import {
    createContext,
    useContext,
    useEffect,
    useRef,
    type ReactNode
} from 'react';
import { Toaster, toast as sonnerToast } from 'sonner';

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

import { useTheme } from '@/core/theme';

/** Toaster en top layer (popover) para quedar sobre modales nativos. */
export function AppToaster() {
    const ref = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();

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
            data-theme={theme}
            {...{ [TOAST_POPOVER_ATTR]: '' }}
            popover="manual"
            className="app-toaster-popover pointer-events-none m-0 h-dvh w-screen max-h-none max-w-none border-0 bg-transparent p-0"
        >
            <Toaster
                theme={theme === 'light' ? 'light' : 'dark'}
                closeButton
                position="bottom-right"
                gap={12}
                visibleToasts={4}
                duration={4000}
                style={{ zIndex: 1, pointerEvents: 'auto' }}
                toastOptions={{
                    style: { pointerEvents: 'auto' },
                    classNames: {
                        toast:
                            'toast-with-progress !overflow-hidden !rounded-xl !border !border-border-strong !bg-bg-modal !pl-4 !pr-10 !py-3.5 !text-sm !leading-snug !text-text-main !shadow-[0_8px_30px_rgba(0,0,0,0.25)] !font-[inherit] gap-2.5',
                        title: 'font-semibold tracking-tight !text-text-main',
                        description: '!text-[0.8125rem] !font-normal !text-text-muted',
                        icon: 'mr-0.5',
                        closeButton:
                            '!left-auto !right-2 !top-1/2 !-translate-y-1/2 !border-0 !bg-transparent !text-text-muted hover:!bg-white/[0.02] hover:!text-text-main transition-colors',
                        success:
                            'progress-success [&_[data-icon]]:!text-emerald-400',
                        error:
                            'progress-error [&_[data-icon]]:!text-rose-400',
                        warning:
                            'progress-warning [&_[data-icon]]:!text-amber-400',
                        info:
                            'progress-info [&_[data-icon]]:!text-primary',
                        loading:
                            'progress-loading [&_[data-icon]]:!text-text-muted'
                    }
                }}
            />
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const showToast = (message: string, type: ToastType = 'info', id?: ToastId): ToastId => {
        promoteToasterAboveModals();
        const opts = id !== undefined ? { id } : undefined;
        switch (type) {
            case 'success':
                return sonnerToast.success(message, opts);
            case 'error':
                return sonnerToast.error(message, opts);
            case 'warning':
                return sonnerToast.warning(message, opts);
            case 'loading':
                return sonnerToast.loading(message, { ...opts, duration: Infinity });
            case 'info':
            default:
                return sonnerToast.info(message, opts);
        }
    };

    const dismissToast = (id?: ToastId) => {
        if (id === undefined) sonnerToast.dismiss();
        else sonnerToast.dismiss(id);
    };

    const showToastPromise = <T,>(
        promise: Promise<T>,
        messages: ToastPromiseMessages<T>
    ): Promise<T> => {
        promoteToasterAboveModals();
        sonnerToast.promise(promise, messages);
        return promise;
    };

    return (
        <ToastContext.Provider value={{ showToast, dismissToast, showToastPromise }}>
            {children}
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
