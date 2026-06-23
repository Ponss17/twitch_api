import { createContext, useContext, type ReactNode } from 'react';
import { toast as sonnerToast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const showToast = (message: string, type: ToastType = 'info') => {
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

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
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
