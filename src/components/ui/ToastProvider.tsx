import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode
} from 'react';
import {
    toastBase,
    toastBorder,
    toastCloseBtn,
    toastContainer,
    toastHiding,
    toastIcon,
    toastMessage
} from '@/lib/tw';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_ICONS: Record<ToastType, string> = {
    success: 'fa-check-circle',
    error: 'fa-circle-xmark',
    info: 'fa-circle-info',
    warning: 'fa-triangle-exclamation'
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [hiding, setHiding] = useState<Set<number>>(new Set());
    const timersRef = useRef<Set<number>>(new Set());

    const scheduleTimer = useCallback((fn: () => void, delay: number) => {
        const id = window.setTimeout(() => {
            timersRef.current.delete(id);
            fn();
        }, delay);
        timersRef.current.add(id);
    }, []);

    const removeToast = useCallback(
        (id: number) => {
            setHiding((prev) => new Set(prev).add(id));
            scheduleTimer(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
                setHiding((prev) => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }, 300);
        },
        [scheduleTimer]
    );

    const showToast = useCallback(
        (message: string, type: ToastType = 'info') => {
            const id = Date.now() + Math.floor(Math.random() * 1000);
            setToasts((prev) => [...prev, { id, message, type }]);
            scheduleTimer(() => removeToast(id), 4000);
        },
        [removeToast, scheduleTimer]
    );

    useEffect(() => {
        const timers = timersRef.current;
        return () => {
            timers.forEach((id) => clearTimeout(id));
            timers.clear();
        };
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className={toastContainer} aria-live="polite">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`${toastBase} ${toastBorder[toast.type]} ${hiding.has(toast.id) ? toastHiding : ''}`}
                        role="alert"
                    >
                        <i
                            className={`fa-solid ${TOAST_ICONS[toast.type]} text-[1.2rem] ${toastIcon[toast.type]}`}
                            aria-hidden
                        />
                        <span className={toastMessage}>{toast.message}</span>
                        <button
                            type="button"
                            className={toastCloseBtn}
                            aria-label="Cerrar notificación"
                            onClick={() => removeToast(toast.id)}
                        >
                            <i className="fa-solid fa-xmark text-base" aria-hidden />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
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
