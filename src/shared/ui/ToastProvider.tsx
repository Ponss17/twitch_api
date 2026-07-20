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
                            'toast-with-progress !rounded-xl !border !border-white/10 !bg-[#141416] !px-4 !py-3.5 !text-sm !leading-snug !text-zinc-100 !shadow-[0_8px_30px_rgba(0,0,0,0.5)] !font-sans gap-2.5',
                        title: 'font-semibold tracking-tight',
                        description: '!text-[0.8125rem] !font-normal !text-white/55',
                        icon: 'mr-0.5',
                        closeButton:
                            '!left-auto !right-0 !top-0 !translate-x-[35%] !-translate-y-[35%] !border !border-white/12 !bg-[#1c1c1f] !text-zinc-400 hover:!border-white/20 hover:!bg-zinc-800 hover:!text-zinc-50',
                        success:
                            'progress-success !border-success/30 !bg-[#0f1a16] !text-emerald-50 [&_[data-icon]]:!text-success',
                        error: 'progress-error !border-error/40 !bg-[#1a1110] !text-red-50 [&_[data-icon]]:!text-error',
                        warning:
                            'progress-warning !border-warning/30 !bg-[#1a160e] !text-amber-50 [&_[data-icon]]:!text-warning',
                        info: 'progress-info !border-primary/30 !bg-[#141218] !text-violet-50 [&_[data-icon]]:!text-primary',
                        loading:
                            'progress-loading !border-zinc-400/35 !bg-[#121214] !text-zinc-100 [&_[data-icon]]:!text-zinc-400'
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
