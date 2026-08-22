import { useState, FormEvent, useRef, useEffect } from 'react';
import {
    X,
    Send,
    AlertCircle,
    CheckCircle2,
    MessageSquare,
    Bug,
    Lightbulb,
    Loader2
} from 'lucide-react';
import { useSession } from '@/core/session/useSession';
import { useTranslation } from '@/core/i18n/I18nContext';
import { API_ENDPOINTS } from '@/core/config/config';
import { authHeaders, withApiCredentials } from '@/core/api/auth';
import { modalPanel, textInput } from '@/core/utils/tw';

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

    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        setStatus('idle');
        setMessage('');
        setDiscordUsername('');
        setType('general');
        setIdentity('twitch');
        setErrorMessage('');
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    const typeBtn = (active: boolean, activeClass: string) =>
        `flex flex-col items-center justify-center rounded-xl border px-1 py-2 transition-all ${
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
            setTimeout(() => onClose(), 2500);
        } catch (error: unknown) {
            setStatus('error');
            setErrorMessage(error instanceof Error ? error.message : fT.errorGeneric);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="feedback-modal-title"
                className={`${modalPanel} w-full max-w-md`}
            >
                <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
                    <div>
                        <h2 id="feedback-modal-title" className="text-base font-semibold text-text-main">
                            {fT.title}
                        </h2>
                        <p className="mt-0.5 text-[0.8125rem] text-text-muted">{fT.desc}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-text-muted transition hover:bg-white/[0.04] hover:text-text-main"
                        aria-label={t.common.aria.close}
                    >
                        <X className="size-5" aria-hidden />
                    </button>
                </div>

                {status === 'success' ? (
                    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
                            <CheckCircle2 className="size-7" aria-hidden />
                        </div>
                        <h3 className="mb-1.5 text-lg font-medium text-text-main">{fT.successTitle}</h3>
                        <p className="text-[0.8125rem] text-text-muted">{fT.successBody}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
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
                                    <MessageSquare className="mb-1 size-5" aria-hidden />
                                    <span className="text-[0.7rem] font-medium">{fT.typeGeneral}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('suggestion')}
                                    className={typeBtn(
                                        type === 'suggestion',
                                        'border-success/40 bg-success/10 text-success'
                                    )}
                                >
                                    <Lightbulb className="mb-1 size-5" aria-hidden />
                                    <span className="text-[0.7rem] font-medium">{fT.typeIdea}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('bug')}
                                    className={typeBtn(
                                        type === 'bug',
                                        'border-error/40 bg-error/10 text-error'
                                    )}
                                >
                                    <Bug className="mb-1 size-5" aria-hidden />
                                    <span className="text-[0.7rem] font-medium">{fT.typeBug}</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
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
                                    <p className="mt-1.5 ml-0.5 text-[0.7rem] text-text-muted">
                                        {fT.discordOptionalHint}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="feedback-modal-message" className="text-[0.8125rem] font-medium text-text-main">
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
                                className={`${textInput} min-h-[120px] resize-none py-3`}
                            />
                        </div>

                        {status === 'error' && (
                            <div className="flex items-center gap-2 rounded-lg bg-error/10 px-3 py-2 text-[0.8125rem] text-error">
                                <AlertCircle className="size-4 shrink-0" aria-hidden />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'loading' || !message.trim()}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-btn py-2.5 text-[0.8125rem] font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {status === 'loading' ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" aria-hidden />
                                    <span>{fT.btnSending}</span>
                                </>
                            ) : (
                                <>
                                    <Send className="size-4" aria-hidden />
                                    <span>{fT.btnSend}</span>
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
