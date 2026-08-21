import { AlertTriangle } from 'lucide-react';
import {
    useEffect,
    useId,
    useRef,
    useState,
    createContext,
    useCallback,
    useContext,
    type ReactNode,
    type ButtonHTMLAttributes
} from 'react';
import { X, type LucideIcon } from 'lucide-react';
import {
    btnIcon,
    dialogBase,
    modalBody,
    modalFooter,
    modalHeader,
    modalOverlay,
    modalPanel,
    modalTitle,
    modalTitleIcon
} from '@/core/utils/tw';
import { promoteToasterAboveModals } from '@/shared/ui/ToastProvider';
import { useTranslation } from '@/core/i18n/I18nContext';

const ModalCloseContext = createContext<(() => void) | null>(null);

export function useModalClose(): (() => void) | null {
    return useContext(ModalCloseContext);
}

/** Botón que cierra con animación de salida (usar dentro de `Modal` / `BaseModal`). */
export function ModalCloseButton({
    className,
    disabled,
    children,
    onClick,
    ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    const close = useModalClose();
    return (
        <button
            type="button"
            className={className}
            disabled={disabled}
            onClick={(e) => {
                onClick?.(e);
                if (!e.defaultPrevented) close?.();
            }}
            {...rest}
        >
            {children}
        </button>
    );
}

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    titleIcon?: LucideIcon;
    /** Icono custom (p. ej. Discord). `null` oculta el icono. */
    titleIconNode?: ReactNode;
    titleBadge?: string;
    children: ReactNode;
    footer?: ReactNode;
    closeOnBackdrop?: boolean;
    /** Bloquea X, Escape, backdrop y useModalClose (p. ej. mientras carga). */
    closeDisabled?: boolean;
}

export interface BaseModalProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    closeOnBackdrop?: boolean;
    closeDisabled?: boolean;
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
    closeDisabled = false,
    className = '',
    dialogClassName = dialogBase,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy
}: BaseModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [closing, setClosing] = useState(false);
    const [animKey, setAnimKey] = useState(0);
    const closeDisabledRef = useRef(closeDisabled);
    closeDisabledRef.current = closeDisabled;

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            setClosing(false);
            setAnimKey((k) => k + 1);
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
            dialog.classList.remove('modal-dialog-closing');
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
        if (closing || closeDisabledRef.current) return;
        setClosing(true);
        const dialog = dialogRef.current;
        const panel = panelRef.current;
        dialog?.classList.add('modal-dialog-closing');

        const finish = () => {
            setClosing(false);
            dialog?.classList.remove('modal-dialog-closing');
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
        }, 380);

        const onEnd = (e: AnimationEvent) => {
            if (e.target !== panel) return;
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
            className={`${dialogClassName}${closing ? ' modal-dialog-closing' : ''}`}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
        >
            <div
                className={modalOverlay}
                onClick={closeOnBackdrop && !closeDisabled ? handleClose : undefined}
            >
                <ModalCloseContext.Provider value={handleClose}>
                    <div
                        key={animKey}
                        ref={panelRef}
                        className={`${className} ${closing ? 'animate-modal-out' : 'animate-modal-in'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {children}
                    </div>
                </ModalCloseContext.Provider>
            </div>
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
    closeOnBackdrop = true,
    closeDisabled = false
}: ModalProps) {
    const titleId = useId();
    return (
        <BaseModal
            open={open}
            onClose={onClose}
            closeOnBackdrop={closeOnBackdrop && !closeDisabled}
            closeDisabled={closeDisabled}
            className={modalPanel}
            aria-labelledby={titleId}
        >
            <ModalChrome
                titleId={titleId}
                title={title}
                TitleIcon={TitleIcon}
                titleIconNode={titleIconNode}
                titleBadge={titleBadge}
                footer={footer}
                fallbackClose={onClose}
                closeDisabled={closeDisabled}
            >
                {children}
            </ModalChrome>
        </BaseModal>
    );
}

function ModalChrome({
    titleId,
    title,
    TitleIcon,
    titleIconNode,
    titleBadge,
    children,
    footer,
    fallbackClose,
    closeDisabled
}: {
    titleId: string;
    title: string;
    TitleIcon: LucideIcon;
    titleIconNode?: ReactNode;
    titleBadge?: string;
    children: ReactNode;
    footer?: ReactNode;
    fallbackClose: () => void;
    closeDisabled: boolean;
}) {
    const { t } = useTranslation();
    const closeFromContext = useContext(ModalCloseContext);
    const handleClose = closeFromContext ?? fallbackClose;

    return (
        <>
            <div className={modalHeader}>
                <h3 id={titleId} className={modalTitle}>
                    {titleIconNode !== undefined
                        ? titleIconNode
                        : <TitleIcon className={modalTitleIcon} aria-hidden="true" />}
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
                    disabled={closeDisabled}
                    onClick={handleClose}
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
        </>
    );
}
