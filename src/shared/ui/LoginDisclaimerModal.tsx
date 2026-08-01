import { useEffect, useState } from 'react';
import { startTwitchLogin } from '@/core/api/auth';
import { legalPath } from '@/core/config/paths';
import { btnSecondary, modalBtnPrimary } from '@/core/utils/tw';
import { Modal } from '@/shared/ui/Modal';
import { Loader2, Check, Shield } from 'lucide-react';
import { TwitchIcon } from '@/shared/ui/icons/BrandIcons';
import { useTranslation } from '@/core/i18n/I18nContext';

interface LoginDisclaimerModalProps {
    open: boolean;
    onClose: () => void;
}

export function LoginDisclaimerModal({ open, onClose }: LoginDisclaimerModalProps) {
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();
    const mT = t.modals.login;

    useEffect(() => {
        if (!open) setLoading(false);
    }, [open]);

    const handleConfirm = () => {
        setLoading(true);
        startTwitchLogin();
    };

    return (
        <Modal
            open={open}
            onClose={() => { if (!loading) onClose(); }}
            title={mT.title}
            titleIcon={Shield}
            closeOnBackdrop={!loading}
            footer={
                <>
                    <button type="button" className={btnSecondary} disabled={loading} onClick={onClose}>
                        {mT.cancel}
                    </button>
                    <button type="button" className={modalBtnPrimary} disabled={loading} onClick={handleConfirm}>
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" />
                                {mT.validating}
                            </>
                        ) : (
                            <>
                                <TwitchIcon className="w-5" aria-hidden="true" />
                                {mT.accept}
                            </>
                        )}
                    </button>
                </>
            }
        >
            <p>
                {mT.desc1}
                <strong>{mT.desc1Bold}</strong>
                {mT.desc1End}
            </p>
            <p>{mT.desc2}</p>
            <ul className="space-y-2 my-4">
                <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#9146ff] shrink-0 mt-1" />
                    {mT.point1}
                </li>
                <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#9146ff] shrink-0 mt-1" />
                    {mT.point2}
                </li>
                <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#9146ff] shrink-0 mt-1" />
                    {mT.point3}
                </li>
            </ul>
            <p className="text-sm opacity-80">
                {mT.disclaimer}
            </p>
            <p className="text-sm">
                <a
                    href={legalPath('privacidad')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline underline-offset-2"
                >
                    {mT.privacyLink}
                </a>
                {' · '}
                <a
                    href={legalPath('terminos')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                >
                    {mT.termsLink}
                </a>
            </p>
        </Modal>
    );
}
