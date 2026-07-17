import { useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import { authHeaders, withApiCredentials } from '@/core/api/auth';
import { useRequiredSession } from '@/core/session/useSession';
import { MessageSquare, Shield, Send, Loader2 } from 'lucide-react';
import {
    btnPrimary,
    fadeIn,
    hoverNeutralControl,
    inputLabel,
    panelCard,
    textareaXl
} from '@/core/utils/tw';
import { useToast } from '@/shared/ui/ToastProvider';
import { InlineIcon } from '@/shared/ui/Icon';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { subtleIcon } from '@/features/dashboard/lib/subtleAccents';

export function FeedbackView() {
    const session = useRequiredSession();
    const { showToast } = useToast();
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);

    const send = async () => {
        if (!message.trim()) {
            showToast('Por favor, escribe un mensaje.', 'error');
            return;
        }

        setSending(true);
        try {
            const body: { message: string; anonymous?: boolean } = { message: message.trim() };
            if (isAnonymous) body.anonymous = true;

            const res = await fetch(API_ENDPOINTS.FEEDBACK, withApiCredentials({
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
                body: JSON.stringify(body)
            }));
            const data = (await res.json()) as { error?: string; message?: string };

            if (res.ok) {
                setMessage('');
                showToast('¡Feedback enviado! Gracias por tu aporte.', 'success');
            } else {
                throw new Error(data.error || data.message || 'Error al enviar');
            }
        } catch (e) {
            showToast((e as Error).message || 'Error al enviar. Intenta más tarde.', 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={fadeIn}>
            <section className={`${panelCard} flex flex-col`}>
                <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                        <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${subtleIcon('primary')}`}
                        >
                            <MessageSquare className="h-4 w-4" aria-hidden />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[0.9375rem] font-semibold tracking-tight text-[#fafafa]">
                                Feedback &amp; Sugerencias
                            </h3>
                            <p className="mt-0.5 text-[0.75rem] leading-snug text-[#8b8b93]">
                                Ayúdanos a mejorar LosPerris API
                            </p>
                        </div>
                    </div>
                    <div className="shrink-0">
                        <InfoTooltip
                            text="Tu mensaje llegará directo a nuestro Discord. ¡Gracias por ayudarnos a mejorar!"
                            placement="bottom"
                        />
                    </div>
                </header>

                <div className="flex flex-col gap-4 p-5">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="feedback-message" className={inputLabel}>
                            Tu Mensaje
                        </label>
                        <textarea
                            id="feedback-message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Cuéntanos qué te gustaría ver, reporta un bug, o danos tu opinión..."
                            className={`${textareaXl} ${hoverNeutralControl} focus:border-primary focus:bg-primary/[0.02]`}
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-lg border border-white/[0.06] bg-bg-main/40 px-3.5 py-3">
                        <div className="min-w-0">
                            <p className="text-[0.8125rem] font-medium text-[#fafafa]">Enviar de forma anónima</p>
                            <p className="mt-0.5 text-[0.75rem] leading-snug text-[#8b8b93]">
                                {isAnonymous
                                    ? 'Tu mensaje se enviará de forma totalmente anónima.'
                                    : 'Incluiremos tu usuario por si necesitamos contactarte.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={isAnonymous}
                            aria-label="Enviar de forma anónima"
                            onClick={() => setIsAnonymous(!isAnonymous)}
                            className="group shrink-0 outline-none"
                        >
                            <div
                                className={`relative flex h-5 w-9 items-center rounded-full transition-colors duration-300 ${
                                    isAnonymous ? 'bg-primary' : 'bg-white/10 group-hover:bg-white/20'
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

                    <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] pt-4 max-[600px]:flex-col max-[600px]:items-stretch">
                        <p className="inline-flex items-start gap-1.5 text-[0.75rem] text-[#71717a]">
                            <InlineIcon icon={Shield} className="mt-0.5" />
                            Llega directo a nuestro Discord.
                        </p>
                        <button
                            type="button"
                            onClick={() => void send()}
                            disabled={sending || !message.trim()}
                            className={`${btnPrimary} !mt-0 shrink-0 max-[600px]:w-full max-[600px]:justify-center`}
                        >
                            {sending ? <Loader2 className="animate-spin" /> : <Send className="h-4 w-4" />}
                            {sending ? 'Enviando...' : 'Enviar Feedback'}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
