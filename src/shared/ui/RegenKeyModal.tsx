import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { modalBtnPrimary, modalBtnSecondary } from '@/core/utils/tw';
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
            footer={<RegenKeyActions loading={loading} setLoading={setLoading} onConfirm={onConfirm} />}
        >
            <p className="mb-3 text-[0.9rem] text-text-muted">
                {rT.prefixWarning} <strong>{rT.warning}</strong>.
            </p>
            <p>{rT.desc1}</p>
            <ul className="my-3">
                <li>{rT.point1}</li>
                <li>{rT.point2}</li>
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
            <button type="button" className={modalBtnPrimary} disabled={loading} onClick={() => void handleConfirm()}>
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        {rT.regenerating}
                    </>
                ) : (
                    rT.confirm
                )}
            </button>
            <ModalCloseButton className={modalBtnSecondary} disabled={loading}>
                {rT.cancel}
            </ModalCloseButton>
        </>
    );
}
