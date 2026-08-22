import { useState, FormEvent, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/core/session/useSession';
import { useTranslation } from '@/core/i18n/I18nContext';
import { API_ENDPOINTS } from '@/core/config/config';
import { authHeaders, withApiCredentials } from '@/core/api/auth';
import { modalBtnPrimary, modalBtnSecondary, textInput } from '@/core/utils/tw';
import { Modal, ModalCloseButton } from '@/shared/ui/Modal';

export interface FeedbackModalProps {
    open: boolean;
    onClose: () => void;
}

type FeedbackType = 'bug' | 'suggestion' | 'general';
type FeedbackIdentity = 'twitch' | 'discord';

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
    const { session } = useSession();
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

    const typeBtn = (active: boolean, activeClass: string) =>
        `flex items-center justify-center rounded-xl border px-2 py-2.5 transition-all ${
            active
                ? activeClass
                : 'border-border-strong bg-bg-secondary text-text-muted hover:bg-white/[0.02] hover:text-text-main'
        }`;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

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

                    <div className="space-y-2">
                        <p className="text-[0.8125rem] font-medium text-text-main">{fT.typeLabel}</p>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setType('general')}
                                className={typeBtn(
                                    type === 'general',
                                    'border-primary/40 bg-primary/10 text-primary'
                                )}
                            >
                                <span className="text-[0.75rem] font-medium">{fT.typeGeneral}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('suggestion')}
                                className={typeBtn(
                                    type === 'suggestion',
                                    'border-success/40 bg-success/10 text-success'
                                )}
                            >
                                <span className="text-[0.75rem] font-medium">{fT.typeIdea}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('bug')}
                                className={typeBtn(
                                    type === 'bug',
                                    'border-error/40 bg-error/10 text-error'
                                )}
                            >
                                <span className="text-[0.75rem] font-medium">{fT.typeBug}</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[0.8125rem] font-medium text-text-main">{fT.contactBy}</p>
                        <div className="flex rounded-lg border border-border-strong bg-bg-secondary p-1">
                            <button
                                type="button"
                                onClick={() => setIdentity('twitch')}
                                className={`flex-1 rounded-md py-1.5 text-[0.8125rem] font-medium transition ${
                                    identity === 'twitch'
                                        ? 'bg-bg-panel text-primary shadow-sm'
                                        : 'text-text-muted hover:text-text-main'
                                }`}
                            >
                                Twitch
                            </button>
                            <button
                                type="button"
                                onClick={() => setIdentity('discord')}
                                title={fT.discordRequiresLink}
                                className={`flex-1 rounded-md py-1.5 text-[0.8125rem] font-medium transition ${
                                    identity === 'discord'
                                        ? 'bg-[#5865F2]/15 text-[#5865F2] shadow-sm'
                                        : 'text-text-muted hover:text-text-main'
                                }`}
                            >
                                Discord
                            </button>
                        </div>

                        {identity === 'twitch' && (
                            <div>
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

                    <div className="space-y-2">
                        <label
                            htmlFor="feedback-modal-message"
                            className="text-[0.8125rem] font-medium text-text-main"
                        >
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
