import { useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import { authHeaders, withApiCredentials } from '@/core/api/auth';
import { useRequiredSession } from '@/core/session/useSession';
import { useDashboardPanel } from '@/features/dashboard/providers/DashboardPanelProvider';
import { MessageSquare, Shield, Send, Loader2 } from 'lucide-react';
import {
    btnPrimary,
    fadeIn,
    inputLabel,
    panelCard,
    textareaXl
} from '@/core/utils/tw';
import { useToast } from '@/shared/ui/ToastProvider';
import { InlineIcon } from '@/shared/ui/Icon';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { subtleIcon } from '@/features/dashboard/lib/subtleAccents';
import { DiscordIcon, TwitchIcon } from '@/shared/ui/icons/BrandIcons';
import { useTranslation } from '@/core/i18n/I18nContext';

type FeedbackIdentity = 'twitch' | 'discord';

export function FeedbackView() {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const fT = t.feedback;
    const { profile } = useDashboardPanel();
    const { showToast } = useToast();
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [identity, setIdentity] = useState<FeedbackIdentity>('twitch');

    const discordLinked = Boolean(profile?.discordId);
    const twitchLabel = profile?.display_name || session.displayName || session.login || 'Twitch';
    const discordLabel = profile?.discordUsername || 'Discord';

    const sendAsHint = isAnonymous 
        ? fT.hintAnonymous 
        : (discordLinked && identity === 'discord') 
            ? fT.hintDiscord(discordLabel) 
            : fT.hintTwitch(twitchLabel);

    const identityBtnClass = (active: boolean, activeBorder: string, activeBg: string) =>
        `flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-[0.8125rem] font-semibold transition ${
            active
                ? `${activeBorder} ${activeBg} text-text-main`
                : 'border-border-strong bg-transparent text-text-muted hover:border-border-strong hover:bg-text-main/5'
        }`;

    const send = async () => {
        if (!message.trim()) {
            showToast(fT.errorEmpty, 'error');
            return;
        }

        setSending(true);
        try {
            const body: {
                message: string;
                anonymous?: boolean;
                identity?: FeedbackIdentity;
            } = { message: message.trim() };

            if (isAnonymous) {
                body.anonymous = true;
            } else if (discordLinked) {
                body.identity = identity;
            } else {
                body.identity = 'twitch';
            }

            const res = await fetch(
                API_ENDPOINTS.FEEDBACK,
                withApiCredentials({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
                    body: JSON.stringify(body)
                })
            );
            const data = (await res.json()) as { error?: string; message?: string };

            if (res.ok) {
                setMessage('');
                showToast(fT.successSend, 'success');
            } else {
                throw new Error(data.error || data.message || fT.errorSend);
            }
        } catch (e) {
            showToast((e as Error).message || fT.errorGeneric, 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={fadeIn}>
            <section className={`${panelCard} flex flex-col`}>
                <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                        <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${subtleIcon('primary')}`}
                        >
                            <MessageSquare className="h-4 w-4" aria-hidden />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-[0.9375rem] font-semibold tracking-tight text-text-main">
                                {fT.title}
                            </h2>
                            <p className="mt-0.5 text-[0.75rem] leading-snug text-text-muted">
                                {fT.desc}
                            </p>
                        </div>
                    </div>
                    <div className="shrink-0">
                        <InfoTooltip
                            text={fT.infoTooltip}
                            placement="bottom"
                        />
                    </div>
                </header>

                <div className="flex flex-col gap-4 p-5">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="feedback-message" className={inputLabel}>
                            {fT.messageLabel}
                        </label>
                        <textarea
                            id="feedback-message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={fT.messagePlaceholder}
                            className={textareaXl}
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-bg-main/40 px-3.5 py-3">
                        <div className="min-w-0">
                            <p className="text-[0.8125rem] font-medium text-text-main">
                                {fT.anonymousTitle}
                            </p>
                            <p className="mt-0.5 text-[0.75rem] leading-snug text-text-muted">
                                {isAnonymous ? fT.anonymousOn : fT.anonymousOff}
                            </p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={isAnonymous}
                            aria-label={fT.anonymousTitle}
                            onClick={() => setIsAnonymous(!isAnonymous)}
                            className="group shrink-0 outline-none"
                        >
                            <div
                                className={`relative flex h-5 w-9 items-center rounded-full transition-colors duration-300 ${
                                    isAnonymous ? 'bg-primary' : 'bg-bg-tertiary border border-border-strong group-hover:bg-bg-hover-neutral'
                                }`}
                            >
                                <div
                                    className={`absolute left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-300 ${
                                        isAnonymous ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                />
                            </div>
                        </button>
                    </div>

                    {!isAnonymous ? (
                        <div className="rounded-lg border border-border-subtle bg-bg-main/40 px-3.5 py-3">
                            <p className="text-[0.8125rem] font-medium text-text-main">
                                {fT.sendAs}
                            </p>
                            {discordLinked ? (
                                <div
                                    className="mt-2.5 grid grid-cols-2 gap-2"
                                    role="radiogroup"
                                    aria-label={t.common.aria.feedbackIdentity}
                                >
                                    <button
                                        type="button"
                                        role="radio"
                                        aria-checked={identity === 'twitch'}
                                        onClick={() => setIdentity('twitch')}
                                        className={identityBtnClass(identity === 'twitch', 'border-primary/50', 'bg-primary/15')}
                                    >
                                        <TwitchIcon className="h-4 w-4" />
                                        <span className="min-w-0 truncate">Twitch · {twitchLabel}</span>
                                    </button>
                                    <button
                                        type="button"
                                        role="radio"
                                        aria-checked={identity === 'discord'}
                                        onClick={() => setIdentity('discord')}
                                        className={identityBtnClass(identity === 'discord', 'border-[#5865F2]/50', 'bg-[#5865F2]/15')}
                                    >
                                        <DiscordIcon className="h-4 w-4 text-[#5865F2]" />
                                        <span className="min-w-0 truncate">Discord · @{discordLabel}</span>
                                    </button>
                                </div>
                            ) : (
                                <p className="mt-1.5 text-[0.75rem] leading-snug text-text-muted">
                                    {fT.linkDiscordText}
                                    <strong className="text-text-muted">{fT.linkDiscordBold}</strong>{fT.linkDiscordEnd}
                                </p>
                            )}
                            <p className="mt-2 text-[0.75rem] leading-snug text-text-muted">{sendAsHint}</p>
                        </div>
                    ) : null}

                    <div className="flex items-center justify-between gap-4 border-t border-border-subtle pt-4 max-[600px]:flex-col max-[600px]:items-stretch">
                        <p className="inline-flex items-start gap-1.5 text-[0.75rem] text-text-muted">
                            <InlineIcon icon={Shield} className="mt-0.5" />
                            {fT.footerText}
                        </p>
                        <button
                            type="button"
                            onClick={() => void send()}
                            disabled={sending || !message.trim()}
                            className={`${btnPrimary} !mt-0 shrink-0 max-[600px]:w-full max-[600px]:justify-center`}
                        >
                            {sending ? <Loader2 className="animate-spin" /> : <Send className="h-4 w-4" />}
                            {sending ? fT.btnSending : fT.btnSend}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
