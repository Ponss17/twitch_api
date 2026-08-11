import { Loader2, Check, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { btnDanger, btnSecondary } from '@/core/utils/tw';
import { useTranslation } from '@/core/i18n/I18nContext';
import { Modal } from './ModalShell';

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
