import { useState } from 'react';
import { AlertCircle, AlertTriangle, Check, CheckCircle2, Info, Loader2, Trash2, Unlink, XCircle } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { btnSecondary, modalBtnPrimary } from '@/core/utils/tw';
import { DiscordIcon } from '@/shared/ui/icons/BrandIcons';
import { useTranslation } from '@/core/i18n/I18nContext';

interface DiscordLinkConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function DiscordLinkConfirmModal({ open, onClose, onConfirm }: DiscordLinkConfirmModalProps) {
    const { t } = useTranslation();
    const dT = t.modals.discordLink;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={dT.title}
            titleIconNode={<DiscordIcon className="h-5 w-5 text-[#5865F2]" />}
            footer={
                <>
                    <button
                        type="button"
                        onClick={onConfirm}
                        data-modal-primary
                        className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#5865F2] px-3 py-2 text-[0.8125rem] font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-110"
                    >
                        <DiscordIcon className="h-4 w-4" aria-hidden="true" />
                        {dT.continue}
                    </button>
                    <button type="button" className={btnSecondary} onClick={onClose}>
                        {t.modals.login.cancel}
                    </button>
                </>
            }
        >
            <p>{dT.desc1}</p>
            <p className="mt-4">{dT.desc2}</p>
            <ul className="my-4 space-y-2">
                <li className="flex items-start gap-2">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#5865F2]" />
                    {dT.point1}
                </li>
                <li className="flex items-start gap-2">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#5865F2]" />
                    {dT.point2}
                </li>
                <li className="flex items-start gap-2">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#5865F2]" />
                    {dT.point3}
                </li>
            </ul>
            <p className="text-sm opacity-80">{dT.disclaimer}</p>
        </Modal>
    );
}

interface DiscordUnlinkConfirmModalProps {
    open: boolean;
    busy?: boolean;
    username?: string | null;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
}

export function DiscordUnlinkConfirmModal({
    open,
    busy = false,
    username,
    onClose,
    onConfirm
}: DiscordUnlinkConfirmModalProps) {
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();
    const dT = t.modals.discordUnlink;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const disabled = loading || busy;

    return (
        <Modal
            open={open}
            onClose={disabled ? () => {} : onClose}
            title={dT.title}
            titleIcon={Unlink}
            closeOnBackdrop={!disabled}
            footer={
                <>
                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={disabled}
                        onClick={() => void handleConfirm()}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {dT.unlinking}
                            </>
                        ) : (
                            <>
                                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                                {dT.confirm}
                            </>
                        )}
                    </button>
                    <button type="button" className={btnSecondary} disabled={disabled} onClick={onClose}>
                        {t.modals.login.cancel}
                    </button>
                </>
            }
        >
            <p>{username ? dT.descUsername(username) : dT.descNoUsername}</p>
            <p className="mt-4">{dT.desc2}</p>
            <ul className="my-4 space-y-2">
                <li className="flex items-start gap-2">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-red-500" />
                    {dT.point1}
                </li>
                <li className="flex items-start gap-2">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-green-500" />
                    {dT.point2}
                </li>
                <li className="flex items-start gap-2">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-green-500" />
                    {dT.point3}
                </li>
            </ul>
            <p className="text-sm opacity-80">{dT.disclaimer}</p>
        </Modal>
    );
}

export type DiscordResultKind =
    | 'linked'
    | 'unlinked'
    | 'error_taken'
    | 'error_auth'
    | 'error_config'
    | 'error';

interface DiscordResultModalProps {
    open: boolean;
    kind: DiscordResultKind | null;
    onClose: () => void;
}

export function DiscordResultModal({ open, kind, onClose }: DiscordResultModalProps) {
    const { t } = useTranslation();
    const dT = t.modals.discordResult;

    if (!kind) return null;

    let title = '';
    let icon = Info;
    let iconClass = '';
    let lead = '';
    let points: string[] = [];
    let isError = false;

    switch (kind) {
        case 'linked':
            title = dT.linked.title;
            icon = CheckCircle2;
            iconClass = 'text-green-400';
            lead = dT.linked.lead;
            points = dT.linked.points;
            break;
        case 'unlinked':
            title = dT.unlinked.title;
            icon = CheckCircle2;
            iconClass = 'text-green-400';
            lead = dT.unlinked.lead;
            points = dT.unlinked.points;
            break;
        case 'error_taken':
            isError = true;
            title = dT.errorTaken.title;
            icon = AlertCircle;
            iconClass = 'text-orange-400';
            lead = dT.errorTaken.lead;
            points = dT.errorTaken.points;
            break;
        case 'error_auth':
            isError = true;
            title = dT.errorAuth.title;
            icon = AlertCircle;
            iconClass = 'text-orange-400';
            lead = dT.errorAuth.lead;
            points = dT.errorAuth.points;
            break;
        case 'error_config':
            isError = true;
            title = dT.errorConfig.title;
            icon = AlertCircle;
            iconClass = 'text-orange-400';
            lead = dT.errorConfig.lead;
            points = dT.errorConfig.points;
            break;
        case 'error':
            isError = true;
            title = dT.error.title;
            icon = AlertTriangle;
            // eslint-disable-next-line
            iconClass = 'text-red-400';
            lead = dT.error.lead;
            points = dT.error.points;
            break;
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            titleIcon={icon}
            footer={
                <button
                    type="button"
                    className={isError ? btnSecondary : modalBtnPrimary}
                    onClick={onClose}
                >
                    {isError ? dT.close : dT.gotIt}
                </button>
            }
        >
            <p>{lead}</p>
            <ul>
                {points.map((point) => (
                    <li key={point}>
                        {isError ? (
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                        ) : (
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" aria-hidden="true" />
                        )}
                        {point}
                    </li>
                ))}
            </ul>
            {kind === 'linked' && dT.linked.hint ? <p className="text-sm opacity-80">{dT.linked.hint}</p> : null}
        </Modal>
    );
}
