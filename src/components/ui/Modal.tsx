import { useEffect, useRef, useState, type ReactNode } from 'react';
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
} from '@/lib/tw';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    titleIcon?: string;
    children: ReactNode;
    footer?: ReactNode;
    closeOnBackdrop?: boolean;
}

export function Modal({
    open,
    onClose,
    title,
    titleIcon = 'fa-triangle-exclamation',
    children,
    footer,
    closeOnBackdrop = true
}: ModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        else if (!open && dialog.open) dialog.close();
    }, [open]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const onCancel = (e: Event) => {
            e.preventDefault();
            onClose();
        };
        dialog.addEventListener('cancel', onCancel);
        return () => dialog.removeEventListener('cancel', onCancel);
    }, [onClose]);

    return (
        <dialog
            ref={dialogRef}
            className={dialogBase}
            onClick={(e) => {
                if (closeOnBackdrop && e.target === dialogRef.current) onClose();
            }}
        >
            <div className={modalPanel}>
                <div className={modalHeader}>
                    <h3 className={modalTitle}>
                        <i className={`fa-solid ${titleIcon} ${modalTitleIcon}`} aria-hidden />
                        {title}
                    </h3>
                    <button type="button" className={btnIcon} aria-label="Cerrar" onClick={onClose}>
                        <i className="fa-solid fa-xmark" aria-hidden />
                    </button>
                </div>
                <div className={modalBody}>{children}</div>
                {footer ? <div className={modalFooter}>{footer}</div> : null}
            </div>
        </dialog>
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
    const dialogRef = useRef<HTMLDialogElement>(null);

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
        if (open && !dialog.open) dialog.showModal();
        else if (!open && dialog.open) dialog.close();
    }, [open]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const onCancel = (e: Event) => {
            e.preventDefault();
            if (!loading) onClose();
        };
        dialog.addEventListener('cancel', onCancel);
        return () => dialog.removeEventListener('cancel', onCancel);
    }, [loading, onClose]);

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
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <dialog
            ref={dialogRef}
            className={`${dialogBase} ${shake ? modalShake : ''}`}
            onClick={(e) => {
                if (e.target === dialogRef.current && !loading) onClose();
            }}
        >
            <div className={dangerModalPanel}>
                <div className={dangerModalHeader}>
                    <h3 className={modalTitle}>
                        <i className={`fa-solid fa-triangle-exclamation ${dangerModalTitleIcon}`} aria-hidden />
                        <span>{title}</span>
                    </h3>
                    <button
                        type="button"
                        className={btnIcon}
                        aria-label="Cerrar"
                        disabled={loading}
                        onClick={onClose}
                    >
                        <i className="fa-solid fa-xmark" aria-hidden />
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
                                <i className="fa-solid fa-spinner fa-spin" aria-hidden />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-trash-can" aria-hidden />
                                {confirmLabel}
                            </>
                        )}
                    </button>
                    <button type="button" className={btnSecondary} disabled={loading} onClick={onClose}>
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
            titleIcon="fa-triangle-exclamation"
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
                                <i className="fa-solid fa-spinner fa-spin" aria-hidden />
                                Regenerando...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-arrows-rotate" aria-hidden />
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
