import { useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import { authHeaders } from '@/core/api/auth';
import { useRequiredSession } from '@/core/session/useSession';
import { MessageCircle, Shield, Send, Loader2 } from 'lucide-react';
import {
    btnPrimary,
    cardFooterFlex,
    inputLabel,
    textareaXl
} from '@/core/utils/tw';
import { useToast } from '@/shared/ui/ToastProvider';
import { InlineIcon } from '@/shared/ui/Icon';
import { MinigameCard } from '@/features/minigames/MinigamesViews';

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
            const body: { message: string; apiKey?: string; anonymous?: boolean } = { message: message.trim() };
            if (!session.token && session.apiKey) body.apiKey = session.apiKey;
            if (isAnonymous) body.anonymous = true;

            const res = await fetch(API_ENDPOINTS.FEEDBACK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
                body: JSON.stringify(body)
            });
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
        <MinigameCard
            icon={MessageCircle}
            title="Feedback & Sugerencias"
            description="Ayúdanos a mejorar LosPerris API"
            info="Tu mensaje llegará directo a nuestro Discord. ¡Gracias por ayudarnos a mejorar!"
        >
            <div className="flex flex-col gap-1.5">
                <label htmlFor="feedback-message" className={inputLabel}>
                    Tu Mensaje
                </label>
                <textarea
                    id="feedback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Cuéntanos qué te gustaría ver, reporta un bug, o danos tu opinión..."
                    className={textareaXl}
                />
            </div>

            <div className="mt-4 flex items-center">
                <button
                    type="button"
                    role="switch"
                    aria-checked={isAnonymous}
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className="group flex items-center gap-3 outline-none"
                >
                    <div className={`relative flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-300 ${
                        isAnonymous ? 'bg-primary' : 'bg-white/10 group-hover:bg-white/20'
                    }`}>
                        <div className={`absolute left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-300 ${
                            isAnonymous ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                    </div>
                    <span className="text-[0.85rem] font-medium text-[#c4c4cc] transition-colors group-hover:text-white">
                        Enviar de forma anónima
                    </span>
                </button>
            </div>

            <div className={cardFooterFlex}>
                <p className="inline-flex max-w-[60%] items-start gap-1.5 text-[0.8125rem] text-[#71717a] max-[600px]:max-w-full">
                    <InlineIcon icon={Shield} className="mt-0.5" />
                    {isAnonymous 
                        ? 'Tu mensaje se enviará de forma totalmente anónima.'
                        : 'Tu mensaje incluirá tu nombre de usuario para poder contactarte si es necesario.'}
                </p>
                <button
                    type="button"
                    onClick={() => void send()}
                    disabled={sending || !message.trim()}
                    className={`${btnPrimary} shrink-0 max-[600px]:w-full max-[600px]:justify-center`}
                >
                    {sending ? <Loader2 className="animate-spin" /> : <Send className="w-4 h-4" />}
                    {sending ? 'Enviando...' : 'Enviar Feedback'}
                </button>
            </div>
        </MinigameCard>
    );
}
