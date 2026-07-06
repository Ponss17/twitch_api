import { AlertTriangle, Loader2 } from 'lucide-react';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X, Trash2, type LucideIcon } from 'lucide-react';
import {
    btnDanger,
    btnIcon,
    btnSecondary,
    confirmWordBadge,
    dangerInput,
    dangerInputGroup,
    dangerInputLabel,
    dangerModalHeader,
    dangerModalPanel,
    dangerModalTitleIcon,
    dialogBase,
    modalBody,
    modalFooter,
    modalHeader,
    modalPanel,
    modalShake,
    modalTitle,
    modalTitleIcon
} from '@/core/ui/tw';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    titleIcon?: LucideIcon;
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
}

export function BaseModal({
    open,
    onClose,
    children,
    closeOnBackdrop = true,
    className = '',
    dialogClassName = dialogBase
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
            return;
        }
        if (!open && dialog.open) {
            setClosing(false);
            dialog.close();
        }
    }, [open]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const onCancel = (e: Event) => {
            e.preventDefault();
            handleClose();
        };
        dialog.addEventListener('cancel', onCancel);
        return () => dialog.removeEventListener('cancel', onCancel);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onClose]);

    const handleClose = () => {
        setClosing(true);
        const panel = panelRef.current;
        if (panel) {
            const onEnd = () => {
                panel.removeEventListener('animationend', onEnd);
                setClosing(false);
                dialogRef.current?.close();
                onClose();
            };
            panel.addEventListener('animationend', onEnd);
        } else {
            setClosing(false);
            dialogRef.current?.close();
            onClose();
        }
    };

    return (
        <dialog
            ref={dialogRef}
            className={dialogClassName}
            onClick={(e) => {
                if (closeOnBackdrop && e.target === dialogRef.current) handleClose();
            }}
        >
            <div
                ref={panelRef}
                className={`${className} ${closing ? 'animate-modal-out' : 'animate-modal-in'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </dialog>
    );
}

export function Modal({
    open,
    onClose,
    title,
    titleIcon: TitleIcon = AlertTriangle,
    titleBadge,
    children,
    footer,
    closeOnBackdrop = true
}: ModalProps) {
    return (
        <BaseModal open={open} onClose={onClose} closeOnBackdrop={closeOnBackdrop} className={modalPanel}>
            <div className={modalHeader}>
                <h3 className={modalTitle}>
                    <TitleIcon className={modalTitleIcon} aria-hidden="true" />
                    {title}
                    {titleBadge ? (
                        <span className="rounded-md border border-primary/35 bg-primary/15 px-1.5 py-0.5 text-[0.625rem] font-bold tracking-wide text-primary">
                            {titleBadge}
                        </span>
                    ) : null}
                </h3>
                <button type="button" className={btnIcon} aria-label="Cerrar" onClick={onClose}>
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className={modalBody}>{children}</div>
            {footer ? <div className={modalFooter}>{footer}</div> : null}
        </BaseModal>
    );
}

interface DangerConfirmModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    confirmWord: string;
    confirmLabel?: string;
    onConfirm: () => void | Promise<void>;
}

export function DangerConfirmModal({
    open,
    onClose,
    title,
    description,
    confirmWord,
    confirmLabel = 'Confirmar y Borrar',
    onConfirm
}: DangerConfirmModalProps) {
    const [confirmInput, setConfirmInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [shake, setShake] = useState(false);
    const [closing, setClosing] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            setConfirmInput('');
            setLoading(false);
            setShake(false);
        }
    }, [open]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            setClosing(false);
            dialog.showModal();
        }
    }, [open]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const onCancel = (e: Event) => {
            e.preventDefault();
            if (!loading) handleClose();
        };
        dialog.addEventListener('cancel', onCancel);
        return () => dialog.removeEventListener('cancel', onCancel);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, onClose]);

    const handleClose = () => {
        setClosing(true);
        const panel = panelRef.current;
        if (panel) {
            const onEnd = () => {
                panel.removeEventListener('animationend', onEnd);
                setClosing(false);
                dialogRef.current?.close();
                onClose();
            };
            panel.addEventListener('animationend', onEnd);
        } else {
            setClosing(false);
            dialogRef.current?.close();
            onClose();
        }
    };

    const wordOk = confirmInput.trim().toUpperCase() === confirmWord.toUpperCase();

    const handleSubmit = async () => {
        if (!wordOk) {
            setShake(true);
            window.setTimeout(() => setShake(false), 500);
            return;
        }
        setLoading(true);
        try {
            await onConfirm();
            handleClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <dialog
            ref={dialogRef}
            className={`${dialogBase} ${shake ? modalShake : ''}`}
            onClick={(e) => {
                if (e.target === dialogRef.current && !loading) handleClose();
            }}
        >
            <div
                ref={panelRef}
                className={`${dangerModalPanel} ${closing ? 'animate-modal-out' : 'animate-modal-in'}`}
            >
                <div className={dangerModalHeader}>
                    <h3 className={modalTitle}>
                        <AlertTriangle className={` ${dangerModalTitleIcon}`} />
                        <span>{title}</span>
                    </h3>
                    <button
                        type="button"
                        className={btnIcon}
                        aria-label="Cerrar"
                        disabled={loading}
                        onClick={handleClose}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className={modalBody}>
                    <p>{description}</p>
                    <div className={dangerInputGroup}>
                        <label htmlFor="danger-modal-confirm" className={dangerInputLabel}>
                            Escribe <span className={confirmWordBadge}>{confirmWord}</span> para confirmar:
                        </label>
                        <input
                            id="danger-modal-confirm"
                            type="text"
                            className={dangerInput}
                            value={confirmInput}
                            autoComplete="off"
                            placeholder="Escribe aquí..."
                            disabled={loading}
                            onChange={(e) => setConfirmInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && wordOk && !loading) {
                                    e.preventDefault();
                                    void handleSubmit();
                                }
                            }}
                        />
                    </div>
                </div>
                <div className={modalFooter}>
                    <button
                        type="button"
                        className={btnDanger}
                        disabled={!wordOk || loading}
                        onClick={() => void handleSubmit()}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                                {confirmLabel}
                            </>
                        )}
                    </button>
                    <button type="button" className={btnSecondary} disabled={loading} onClick={handleClose}>
                        Cancelar
                    </button>
                </div>
            </div>
        </dialog>
    );
}

interface RegenKeyModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
}

export function RegenKeyModal({ open, onClose, onConfirm }: RegenKeyModalProps) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="¿Estás seguro de regenerar tu API Key?"
            titleIcon={AlertTriangle}
            footer={
                <>
                    <button
                        type="button"
                        className={btnDanger}
                        disabled={loading}
                        onClick={() => void handleConfirm()}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" />
                                Regenerando...
                            </>
                        ) : (
                            <>
                                <X className="w-5 h-5 text-[#c4c4cc] group-hover:text-white transition" />
                                Sí, regenerar
                            </>
                        )}
                    </button>
                    <button type="button" className={btnSecondary} disabled={loading} onClick={onClose}>
                        Cancelar
                    </button>
                </>
            }
        >
            <p>
                Al regenerar tu API Key, <strong>la clave anterior dejará de funcionar inmediatamente</strong>.
            </p>
            <p>
                Tendrás que actualizar el token en todos tus bots (Nightbot, StreamElements, Fossabot, etc.) para
                que los comandos sigan funcionando.
            </p>
            <p className="text-sm opacity-80">Esta acción no se puede deshacer.</p>
        </Modal>
    );
}
