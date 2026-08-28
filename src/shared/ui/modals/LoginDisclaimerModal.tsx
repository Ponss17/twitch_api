import { useEffect, useState } from 'react';
import { startTwitchLogin } from '@/core/api/auth';
import { legalPath } from '@/core/config/paths';
import { modalBtnSecondary, modalBtnPrimary } from '@/core/utils/tw';
import { Modal, ModalCloseButton } from '@/shared/ui/modals/Modal';
import { Loader2 } from 'lucide-react';
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
            onClose={onClose}
            title={mT.title}
            closeOnBackdrop={!loading}
            closeDisabled={loading}
            footer={
                <>
                    <button type="button" className={modalBtnPrimary} disabled={loading} onClick={handleConfirm}>
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                {mT.validating}
                            </>
                        ) : (
                            <>
                                <TwitchIcon className="h-4 w-4" aria-hidden="true" />
                                {mT.accept}
                            </>
                        )}
                    </button>
                    <ModalCloseButton className={modalBtnSecondary} disabled={loading}>
                        {mT.cancel}
                    </ModalCloseButton>
                </>
            }
        >
            <p>
                {mT.desc1}
                <strong>{mT.desc1Bold}</strong>
                {mT.desc1End}
            </p>
            <p>{mT.desc2}</p>
            <ul className="my-4">
                <li>{mT.point1}</li>
                <li>{mT.point2}</li>
                <li>{mT.point3}</li>
            </ul>
            <p className="text-sm opacity-80">{mT.disclaimer}</p>
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
