import { AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useId, useRef, useState, useCallback, type ReactNode } from 'react';
import { X, Trash2 } from 'lucide-react';
import {
    btnIcon,
    btnSecondary,
    dangerInput,
    dangerInputGroup,
    dangerInputLabel,
    dangerModalHeader,
    dangerModalPanel,
    dangerModalTitleIcon,
    dialogBase,
    modalBody,
    modalFooter,
    modalShake,
    modalTitle
} from '@/core/utils/tw';
import { promoteToasterAboveModals } from '@/shared/ui/ToastProvider';
import { useTranslation } from '@/core/i18n/I18nContext';

interface DangerConfirmModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    confirmWord: string;
    confirmLabel?: string;
    onConfirm: () => void | Promise<void>;
    loading?: boolean;
    /** Extra content between description and confirm input (e.g. scope checkboxes). */
    children?: ReactNode;
    /** Extra gate besides typing the confirm word. */
    canConfirm?: boolean;
}

export function DangerConfirmModal({
    open,
    onClose,
    title,
    description,
    confirmWord,
    confirmLabel,
    onConfirm,
    loading = false,
    children,
    canConfirm = true
}: DangerConfirmModalProps) {
    const { t } = useTranslation();
    const dT = t.modals.danger;
    const finalConfirmLabel = confirmLabel || dT.defaultConfirm;

    const [confirmInput, setConfirmInput] = useState('');
    const [shake, setShake] = useState(false);
    const [closing, setClosing] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    const descId = useId();

    useEffect(() => {
        if (!open) {
            setConfirmInput('');
            setShake(false);
        }
    }, [open]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            setClosing(false);
            dialog.showModal();
            promoteToasterAboveModals();
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

    const handleClose = useCallback(() => {
        if (closing) return;
        setClosing(true);
        const panel = panelRef.current;
        
        const finish = () => {
            setClosing(false);
            dialogRef.current?.close();
            onClose();
        };
        
        if (panel) {
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
        } else {
            finish();
        }
    }, [onClose, closing]);

    useEffect(() => {
        return () => {
            setClosing(false);
        };
    }, []);

    const wordOk = confirmInput.trim().toUpperCase() === confirmWord.toUpperCase();
    const ready = wordOk && canConfirm;

    const handleSubmit = async () => {
        if (!ready) {
            setShake(true);
            window.setTimeout(() => setShake(false), 500);
            return;
        }
        await onConfirm();
        handleClose();
    };

    return (
        <dialog
            ref={dialogRef}
            className={`${dialogBase} ${shake ? modalShake : ''}`}
            aria-labelledby={titleId}
            aria-describedby={descId}
            onClick={(e) => {
                if (e.target === dialogRef.current && !loading) handleClose();
            }}
        >
            <div
                ref={panelRef}
                className={`${dangerModalPanel} ${closing ? 'animate-modal-out' : 'animate-modal-in'}`}
            >
                <div className={dangerModalHeader}>
                    <h3 id={titleId} className={modalTitle}>
                        <AlertTriangle className={` ${dangerModalTitleIcon}`} aria-hidden="true" />
                        <span>{title}</span>
                    </h3>
                    <button
                        type="button"
                        className={btnIcon}
                        aria-label={t.common.aria.close}
                        tabIndex={-1}
                        disabled={loading}
                        onClick={handleClose}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className={modalBody}>
                    <p id={descId}>{description}</p>
                    {children}
                    <div className={dangerInputGroup}>
                        <label htmlFor="danger-modal-confirm" className={dangerInputLabel}>
                            {dT.typeToConfirm(confirmWord)}
                        </label>
                        <input
                            id="danger-modal-confirm"
                            type="text"
                            className={dangerInput}
                            value={confirmInput}
                            autoComplete="off"
                            placeholder={dT.placeholder}
                            disabled={loading}
                            onChange={(e) => setConfirmInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && ready && !loading) {
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
                        disabled={!ready || loading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-error px-4 py-2 font-medium text-white transition hover:bg-error/90 disabled:opacity-50 sm:w-auto"
                        onClick={() => void handleSubmit()}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {dT.processing}
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                                {finalConfirmLabel}
                            </>
                        )}
                    </button>
                    <button type="button" className={btnSecondary} disabled={loading} onClick={handleClose}>
                        {dT.cancel}
                    </button>
                </div>
            </div>
        </dialog>
    );
}
