import { AlertTriangle, Loader2, Copy, Check, KeyRound, ShieldAlert } from 'lucide-react';

import { useEffect, useId, useRef, useState, createContext, useCallback, type ReactNode } from 'react';
import { X, Trash2, type LucideIcon } from 'lucide-react';
import {
    btnDanger,
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
    modalBtnPrimary,
    modalFooter,
    modalHeader,
    modalPanel,
    modalShake,
    modalTitle,
    modalTitleIcon
} from '@/core/utils/tw';
import { promoteToasterAboveModals } from '@/shared/ui/ToastProvider';
import { useTranslation } from '@/core/i18n/I18nContext';
import { copyText } from '@/core/utils/clipboard';

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

interface DangerConfirmModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    confirmWord: string;
    confirmLabel?: string;
    onConfirm: () => void | Promise<void>;
    loading?: boolean;
}

export function DangerConfirmModal({
    open,
    onClose,
    title,
    description,
    confirmWord,
    confirmLabel,
    onConfirm,
    loading = false
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

    const handleSubmit = async () => {
        if (!wordOk) {
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
                        disabled={!wordOk || loading}
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

interface RegenKeyModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
}

export function RegenKeyModal({ open, onClose, onConfirm }: RegenKeyModalProps) {
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();
    const rT = t.modals.regenKey;

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
            title={rT.title}
            titleIcon={KeyRound}
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
                                <Loader2 className="animate-spin" aria-hidden="true" />
                                {rT.regenerating}
                            </>
                        ) : (
                            <>
                                <KeyRound className="h-4 w-4" aria-hidden="true" />
                                {rT.confirm}
                            </>
                        )}
                    </button>
                    <button type="button" className={btnSecondary} disabled={loading} onClick={onClose}>
                        {rT.cancel}
                    </button>
                </>
            }
        >
            <div className="mb-4 flex items-start gap-3">
                <KeyRound className="h-5 w-5 text-warning" />
                <div className="text-center sm:text-left">
                    <h3 className="text-lg font-bold text-white">{rT.title}</h3>
                    <p className="mt-1 text-[0.9rem] text-text-muted">
                        {rT.prefixWarning} <strong>{rT.warning}</strong>.
                    </p>
                </div>
            </div>
            <p>{rT.desc1}</p>
            <ul>
                <li>
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {rT.point1}
                </li>
                <li>
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {rT.point2}
                </li>
            </ul>
            <p className="text-sm opacity-80">{rT.disclaimer}</p>
        </Modal>
    );
}

interface PostRegenKeyModalProps {
    open: boolean;
    apiKey: string;
    onClose: () => void;
}

export function PostRegenKeyModal({ open, apiKey, onClose }: PostRegenKeyModalProps) {
    const [copied, setCopied] = useState(false);
    const { t } = useTranslation();
    const pT = t.modals.postRegenKey;

    const handleCopy = async () => {
        const ok = await copyText(apiKey);
        if (ok) {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={pT.title}
            titleIcon={ShieldAlert}
            footer={
                <button type="button" className={modalBtnPrimary} onClick={() => void handleCopy()}>
                    {copied ? (
                        <>
                            <Check className="h-4 w-4" aria-hidden="true" />
                            {pT.copied}
                        </>
                    ) : (
                        <>
                            <Copy className="h-4 w-4" aria-hidden="true" />
                            {pT.copy}
                        </>
                    )}
                </button>
            }
        >
            <p>
                <strong>{pT.desc1}</strong>
            </p>
            <ul>
                <li>
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {pT.point1}
                </li>
                <li>
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {pT.point2}
                </li>
            </ul>
            <code className="mt-1 block break-all rounded-lg border border-border-subtle bg-black/40 px-3 py-2.5 font-mono text-sm text-[#c4b5fd]">
                {apiKey}
            </code>
            <p className="text-sm opacity-80">{pT.disclaimer}</p>
        </Modal>
    );
}
