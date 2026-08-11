import { AlertTriangle } from 'lucide-react';
import { useEffect, useId, useRef, useState, createContext, useCallback, type ReactNode } from 'react';
import { X, type LucideIcon } from 'lucide-react';
import {
    btnIcon,
    dialogBase,
    modalBody,
    modalFooter,
    modalHeader,
    modalPanel,
    modalTitle,
    modalTitleIcon
} from '@/core/utils/tw';
import { promoteToasterAboveModals } from '@/shared/ui/ToastProvider';
import { useTranslation } from '@/core/i18n/I18nContext';

const ModalCloseContext = createContext<(() => void) | null>(null);

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    titleIcon?: LucideIcon;
    /** Icono custom (p. ej. Discord) — tiene prioridad sobre titleIcon. */
    titleIconNode?: ReactNode;
    titleBadge?: string;
    children: ReactNode;
    footer?: ReactNode;
    closeOnBackdrop?: boolean;
}

export interface BaseModalProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    closeOnBackdrop?: boolean;
    className?: string;
    dialogClassName?: string;
    /** Asocia el diálogo a un título visible (`id` del heading). */
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
}

export function BaseModal({
    open,
    onClose,
    children,
    closeOnBackdrop = true,
    className = '',
    dialogClassName = dialogBase,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy
}: BaseModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            setClosing(false);
            dialog.showModal();
            promoteToasterAboveModals();
            // El <dialog> enfoca el primer control y lo deja “marcado”.
            // Enfocamos el panel (sin anillo) para no pintar la X ni el CTA.
            const focusPanel = () => {
                const panel = panelRef.current;
                if (!panel) return;
                if (!panel.hasAttribute('tabindex')) panel.tabIndex = -1;
                panel.focus({ preventScroll: true });
            };
            requestAnimationFrame(() => {
                focusPanel();
                window.setTimeout(focusPanel, 0);
                window.setTimeout(focusPanel, 50);
            });
            return;
        }
        if (!open && dialog.open) {
            setClosing(false);
            dialog.close();
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    const handleClose = useCallback(() => {
        if (closing) return;
        setClosing(true);
        const dialog = dialogRef.current;
        const panel = panelRef.current;

        const finish = () => {
            setClosing(false);
            dialog?.close();
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
        }, 400);

        const onEnd = () => {
            if (done) return;
            done = true;
            window.clearTimeout(fallback);
            panel.removeEventListener('animationend', onEnd);
            finish();
        };

        panel.addEventListener('animationend', onEnd);
    }, [onClose, closing]);

    useEffect(() => {
        return () => {
            setClosing(false);
        };
    }, []);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const onCancel = (e: Event) => {
            e.preventDefault();
            handleClose();
        };
        dialog.addEventListener('cancel', onCancel);
        return () => dialog.removeEventListener('cancel', onCancel);
    }, [handleClose]);

    return (
        <dialog
            ref={dialogRef}
            className={dialogClassName}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
            onClick={(e) => {
                if (closeOnBackdrop && e.target === dialogRef.current) handleClose();
            }}
        >
            <ModalCloseContext.Provider value={handleClose}>
                <div
                    ref={panelRef}
                    className={`${className} ${closing ? 'animate-modal-out' : 'animate-modal-in'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {children}
                </div>
            </ModalCloseContext.Provider>
        </dialog>
    );
}

export function Modal({
    open,
    onClose,
    title,
    titleIcon: TitleIcon = AlertTriangle,
    titleIconNode,
    titleBadge,
    children,
    footer,
    closeOnBackdrop = true
}: ModalProps) {
    const titleId = useId();
    const { t } = useTranslation();
    return (
        <BaseModal
            open={open}
            onClose={onClose}
            closeOnBackdrop={closeOnBackdrop}
            className={modalPanel}
            aria-labelledby={titleId}
        >
            <div className={modalHeader}>
                <h3 id={titleId} className={modalTitle}>
                    {titleIconNode ?? <TitleIcon className={modalTitleIcon} aria-hidden="true" />}
                    {title}
                    {titleBadge ? (
                        <span className="rounded-md border border-primary/35 bg-primary/15 px-1.5 py-0.5 text-[0.625rem] font-bold tracking-wide text-primary">
                            {titleBadge}
                        </span>
                    ) : null}
                </h3>
                <button
                    type="button"
                    className={btnIcon}
                    aria-label={t.common.aria.close}
                    tabIndex={-1}
                    onClick={onClose}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className={modalBody}>{children}</div>
            {footer ? (
                <div className={modalFooter} data-modal-footer>
                    {footer}
                </div>
            ) : null}
        </BaseModal>
    );
}
