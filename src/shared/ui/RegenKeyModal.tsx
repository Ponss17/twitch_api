import { Loader2, Check, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { btnDanger, modalBtnSecondary } from '@/core/utils/tw';
import { useTranslation } from '@/core/i18n/I18nContext';
import { Modal, ModalCloseButton, useModalClose } from './ModalShell';

interface RegenKeyModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
}

export function RegenKeyModal({ open, onClose, onConfirm }: RegenKeyModalProps) {
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();
    const rT = t.modals.regenKey;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={rT.title}
            titleIcon={KeyRound}
            footer={<RegenKeyActions loading={loading} setLoading={setLoading} onConfirm={onConfirm} />}
        >
            <div className="mb-4 flex items-start gap-3">
                <KeyRound className="h-5 w-5 text-warning" />
                <div className="text-center sm:text-left">
                    <p className="text-lg font-bold text-white">{rT.title}</p>
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

function RegenKeyActions({
    loading,
    setLoading,
    onConfirm
}: {
    loading: boolean;
    setLoading: (v: boolean) => void;
    onConfirm: () => void | Promise<void>;
}) {
    const close = useModalClose();
    const { t } = useTranslation();
    const rT = t.modals.regenKey;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
            close?.();
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button type="button" className={btnDanger} disabled={loading} onClick={() => void handleConfirm()}>
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
            <ModalCloseButton className={modalBtnSecondary} disabled={loading}>
                {rT.cancel}
            </ModalCloseButton>
        </>
    );
}
