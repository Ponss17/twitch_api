import { useState, FormEvent, useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/core/session/useSession';
import { useTranslation } from '@/core/i18n/I18nContext';
import { API_ENDPOINTS } from '@/core/config/config';
import { authHeaders, withApiCredentials } from '@/core/api/auth';
import { inputLabel, modalBtnPrimary, modalBtnSecondary, textInput } from '@/core/utils/tw';
import { Modal, ModalCloseButton } from '@/shared/ui/Modal';
import { SelectField } from '@/shared/ui/SelectField';
import { DiscordIcon } from '@/shared/ui/icons/BrandIcons';
import { useOptionalDashboardPanel } from '@/features/dashboard/providers/DashboardPanelProvider';
import { staticPath } from '@/core/config/paths';

export interface FeedbackModalProps {
    open: boolean;
    onClose: () => void;
}

type FeedbackType = 'bug' | 'suggestion' | 'general';
type FeedbackIdentity = 'twitch' | 'discord';

function ContactAvatar({
    src,
    fallback
}: {
    src?: string | null;
    fallback: ReactNode;
}) {
    if (src) {
        return (
            <img
                src={src}
                alt=""
                className="size-3.5 rounded-full object-cover"
                loading="lazy"
            />
        );
    }
    return <>{fallback}</>;
}

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
    const { session } = useSession();
    const panel = useOptionalDashboardPanel();
    const { t } = useTranslation();
    const fT = t.feedback;

    const [type, setType] = useState<FeedbackType>('general');
    const [identity, setIdentity] = useState<FeedbackIdentity>('twitch');
    const [discordUsername, setDiscordUsername] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!open) return;
        setStatus('idle');
        setMessage('');
        setDiscordUsername('');
        setType('general');
        setIdentity('twitch');
        setErrorMessage('');
    }, [open]);

    const twitchAvatar =
        session?.profile_image_url?.replace('300x300', '70x70') ?? staticPath('/img/logo.svg');
    const discordLinked = Boolean(panel?.profile?.discordId);
    const discordAvatar = panel?.profile?.discordAvatar?.replace('size=128', 'size=64') ?? null;

    useEffect(() => {
        if (!discordLinked && identity === 'discord') {
            setIdentity('twitch');
        }
    }, [discordLinked, identity]);

    const typeOptions = [
        { value: 'general', label: fT.typeGeneral },
        { value: 'suggestion', label: fT.typeIdea },
        { value: 'bug', label: fT.typeBug }
    ];

    const identityOptions = [
        {
            value: 'twitch',
            label: 'Twitch',
            icon: <ContactAvatar src={twitchAvatar} fallback={null} />
        },
        {
            value: 'discord',
            label: 'Discord',
            icon: (
                <ContactAvatar
                    src={discordLinked ? discordAvatar : null}
                    fallback={<DiscordIcon className="size-3.5" />}
                />
            ),
            disabled: !discordLinked,
            title: discordLinked ? undefined : fT.discordRequiresLink
        }
    ];

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        if (identity === 'discord' && !discordLinked) {
            setStatus('error');
            setErrorMessage(fT.discordRequiresLink);
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        try {
            const res = await fetch(
                API_ENDPOINTS.FEEDBACK,
                withApiCredentials({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...authHeaders(session)
                    },
                    body: JSON.stringify({
                        message: message.trim(),
                        anonymous: false,
                        identity,
                        type,
                        discordUsername: identity === 'twitch' ? discordUsername.trim() : undefined
                    })
                })
            );

            if (!res.ok) {
                const data = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(data.error || fT.errorSend);
            }

            setStatus('success');
            setTimeout(() => onClose(), 2200);
        } catch (error: unknown) {
            setStatus('error');
            setErrorMessage(error instanceof Error ? error.message : fT.errorGeneric);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={fT.title}
            closeDisabled={status === 'loading'}
            footer={
                status === 'success' ? undefined : (
                    <>
                        <button
                            type="submit"
                            form="feedback-modal-form"
                            disabled={status === 'loading' || !message.trim()}
                            className={modalBtnPrimary}
                        >
                            {status === 'loading' ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" aria-hidden />
                                    {fT.btnSending}
                                </>
                            ) : (
                                fT.btnSend
                            )}
                        </button>
                        <ModalCloseButton className={modalBtnSecondary} disabled={status === 'loading'}>
                            {t.common.cancel}
                        </ModalCloseButton>
                    </>
                )
            }
        >
            {status === 'success' ? (
                <div className="py-6 text-center">
                    <h4 className="mb-1 text-[1rem] font-semibold text-text-main">{fT.successTitle}</h4>
                    <p className="text-[0.8125rem] text-text-muted">{fT.successBody}</p>
                </div>
            ) : (
                <form id="feedback-modal-form" onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-[0.8125rem] text-text-muted">{fT.desc}</p>

                    <div className="space-y-1.5">
                        <label htmlFor="feedback-modal-type" className={inputLabel}>
                            {fT.typeLabel}
                        </label>
                        <SelectField
                            id="feedback-modal-type"
                            aria-label={fT.typeLabel}
                            value={type}
                            options={typeOptions}
                            className="!max-w-none w-full"
                            onChange={(e) => setType(e.target.value as FeedbackType)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="feedback-modal-contact" className={inputLabel}>
                            {fT.contactBy}
                        </label>
                        <SelectField
                            id="feedback-modal-contact"
                            aria-label={fT.contactBy}
                            value={identity}
                            options={identityOptions}
                            className="!max-w-none w-full"
                            onChange={(e) => {
                                const next = e.target.value as FeedbackIdentity;
                                if (next === 'discord' && !discordLinked) return;
                                setIdentity(next);
                            }}
                        />
                        {identity === 'twitch' && (
                            <div className="pt-1">
                                <input
                                    type="text"
                                    placeholder={fT.discordOptionalPlaceholder}
                                    value={discordUsername}
                                    onChange={(e) => setDiscordUsername(e.target.value)}
                                    className={textInput}
                                />
                                <p className="mt-1.5 text-[0.7rem] text-text-muted">
                                    {fT.discordOptionalHint}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="feedback-modal-message" className={inputLabel}>
                            {fT.messageLabel}
                        </label>
                        <textarea
                            id="feedback-modal-message"
                            required
                            minLength={5}
                            maxLength={2000}
                            placeholder={fT.messagePlaceholder}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className={`${textInput} min-h-[110px] resize-none py-3`}
                        />
                    </div>

                    {status === 'error' && (
                        <div className="rounded-lg bg-error/10 px-3 py-2 text-[0.8125rem] text-error">
                            {errorMessage}
                        </div>
                    )}
                </form>
            )}
        </Modal>
    );
}
