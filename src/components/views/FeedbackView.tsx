import { useState } from 'react';
import { API_ENDPOINTS } from '@/lib/config';
import { authHeaders } from '@/lib/auth';
import { useRequiredSession } from '@/hooks/useSession';
import { MessageCircle, Shield, Send, Loader2 } from 'lucide-react';
import {
    btnPrimary,
    cardFooterFlex,
    inputLabel,
    textareaXl
} from '@/lib/tw';
import { useToast } from '@/components/ui/ToastProvider';
import { InlineIcon } from '@/components/ui/Icon';
import { MinigameCard } from './MinigamesViews';

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

            <div className="mt-3 flex items-center gap-2">
                <input
                    type="checkbox"
                    id="feedback-anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0"
                />
                <label htmlFor="feedback-anonymous" className="text-sm text-[#c4c4cc] cursor-pointer hover:text-white transition-colors">
                    Enviar de forma anónima
                </label>
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
