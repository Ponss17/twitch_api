import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { btnIcon } from '@/core/utils/tw';

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

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (open) {
            dialog.showModal();
            document.body.style.overflow = 'hidden';
        } else {
            dialog.close();
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    // Handle escape key
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleCancel = (e: Event) => {
            e.preventDefault();
            onClose();
        };

        dialog.addEventListener('cancel', handleCancel);
        return () => dialog.removeEventListener('cancel', handleCancel);
    }, [onClose]);

    return (
        <dialog
            ref={dialogRef}
            onClick={(e) => {
                if (e.target === dialogRef.current) onClose();
            }}
            className="fixed inset-y-0 left-auto right-0 m-0 h-full max-h-none w-full max-w-md translate-x-full overflow-hidden border-l border-white/[0.04] bg-[#09090b] text-[#fafafa] shadow-2xl transition-transform duration-300 ease-in-out open:translate-x-0 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
        >
            <div className="flex h-full flex-col">
                <header className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-4">
                    <div>
                        <h2 className="text-[1.15rem] font-bold tracking-tight text-[#fafafa]">{title}</h2>
                        {description && (
                            <p className="mt-0.5 text-[0.8rem] leading-relaxed text-[#8b8b93]">{description}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`${btnIcon} ml-4 shrink-0 rounded-full p-2`}
                        aria-label="Cerrar panel"
                    >
                        <X className="h-5 w-5" aria-hidden />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6">{children}</div>

                {footer && (
                    <footer className="shrink-0 border-t border-white/[0.06] bg-[#09090b] px-6 py-4">
                        {footer}
                    </footer>
                )}
            </div>
        </dialog>
    );
}
