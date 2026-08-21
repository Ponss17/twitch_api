import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from '@/core/i18n/I18nContext';
import { X } from 'lucide-react';
import { btnIcon } from '@/core/utils/tw';
import { promoteToasterAboveModals } from '@/shared/ui/ToastProvider';

interface SheetProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
}

export function Sheet({ open, onClose, title, description, children, footer }: SheetProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [closing, setClosing] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (open && !dialog.open) {
            setClosing(false);
            dialog.showModal();
            promoteToasterAboveModals();
            document.body.style.overflow = 'hidden';
            return;
        }

        if (!open && dialog.open) {
            setClosing(false);
            dialog.close();
            document.body.style.overflow = '';
        }
    }, [open]);

    useEffect(() => {
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleClose = useCallback(() => {
        if (closing) return;
        setClosing(true);
        const dialog = dialogRef.current;
        const panel = panelRef.current;

        const finish = () => {
            setClosing(false);
            dialog?.close();
            document.body.style.overflow = '';
            onClose();
        };

        if (!panel) {
            finish();
            return;
        }

        let done = false;
        const fallback = window.setTimeout(() => {
            if (done) return;
            done = true;
            finish();
        }, 360);

        const onEnd = () => {
            if (done) return;
            done = true;
            window.clearTimeout(fallback);
            panel.removeEventListener('animationend', onEnd);
            finish();
        };

        panel.addEventListener('animationend', onEnd);
    }, [onClose, closing]);

    // Handle escape key
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleCancel = (e: Event) => {
            e.preventDefault();
            handleClose();
        };

        dialog.addEventListener('cancel', handleCancel);
        return () => dialog.removeEventListener('cancel', handleCancel);
    }, [handleClose]);

    return (
        <dialog
            ref={dialogRef}
            onClick={(e) => {
                if (e.target === dialogRef.current) handleClose();
            }}
            className="fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none border-none bg-transparent p-0 overflow-hidden backdrop:bg-black/65 backdrop:backdrop-blur-xs"
        >
            <div
                ref={panelRef}
                onClick={(e) => e.stopPropagation()}
                className={`fixed inset-y-0 right-0 z-10 flex h-full w-full max-w-md flex-col border-l border-border-subtle bg-bg-modal text-text-main shadow-2xl ${
                    closing ? 'animate-sheet-out' : 'animate-sheet-in'
                }`}
            >
                <header className="flex shrink-0 items-center justify-between border-b border-border-subtle px-6 py-4">
                    <div>
                        <h2 className="text-[1.15rem] font-bold tracking-tight text-text-main">{title}</h2>
                        {description && (
                            <p className="mt-0.5 text-[0.8rem] leading-relaxed text-text-muted">{description}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className={`${btnIcon} ml-4 shrink-0 rounded-full p-2`}
                        aria-label={t.common.aria.closePanel}
                    >
                        <X className="h-5 w-5" aria-hidden />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6">{children}</div>

                {footer && (
                    <footer className="shrink-0 border-t border-border-subtle bg-bg-secondary px-6 py-4">
                        {footer}
                    </footer>
                )}
            </div>
        </dialog>
    );
}
