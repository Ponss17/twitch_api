import { Copy, Check, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { modalBtnPrimary } from '@/core/utils/tw';
import { useTranslation } from '@/core/i18n/I18nContext';
import { copyText } from '@/core/utils/clipboard';
import { Modal } from './ModalShell';

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
