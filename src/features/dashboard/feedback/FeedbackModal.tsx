import { useState, FormEvent, useRef, useEffect } from 'react';
import { X, Send, AlertCircle, CheckCircle2, MessageSquare, Bug, Lightbulb, Loader2 } from 'lucide-react';
import { useSession } from '@/core/session/useSession';

export interface FeedbackModalProps {
    open: boolean;
    onClose: () => void;
}

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
    const { session } = useSession();

    const [type, setType] = useState<'bug' | 'suggestion' | 'general'>('general');
    const [identity, setIdentity] = useState<'twitch' | 'discord'>('twitch');
    const [discordUsername, setDiscordUsername] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            setStatus('idle');
            setMessage('');
            setDiscordUsername('');
        }
    }, [open]);

    // Cerrar al hacer clic afuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, onClose]);

    if (!open) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setStatus('loading');
        setErrorMessage('');

        try {
            const res = await fetch('/api/system/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.token || ''}`
                },
                body: JSON.stringify({
                    message: message.trim(),
                    anonymous: false,
                    identity,
                    type,
                    discordUsername: identity === 'twitch' ? discordUsername.trim() : undefined
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al enviar feedback');
            }

            setStatus('success');
            setTimeout(() => {
                onClose();
            }, 2500);
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Ocurrió un error inesperado');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="w-full max-w-md bg-bg-surface border border-border-main rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 zoom-in-95 duration-300"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-main/50 bg-bg-surface/50">
                    <div>
                        <h2 className="text-lg font-semibold text-text-main">Enviar Feedback</h2>
                        <p className="text-sm text-text-muted mt-0.5">Ayúdanos a mejorar el panel</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-text-muted hover:text-text-main hover:bg-bg-hover rounded-full transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {status === 'success' ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-medium text-text-main mb-2">¡Gracias por tu feedback!</h3>
                        <p className="text-text-muted">Hemos recibido tu mensaje y lo revisaremos pronto.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Tipo de Feedback */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-main">Tipo</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setType('general')}
                                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all ${
                                        type === 'general' 
                                            ? "border-brand-main bg-brand-main/10 text-brand-main" 
                                            : "border-border-main bg-bg-main text-text-muted hover:bg-bg-hover hover:text-text-main"
                                    }`}
                                >
                                    <MessageSquare className="w-5 h-5 mb-1" />
                                    <span className="text-xs font-medium">General</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('suggestion')}
                                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all ${
                                        type === 'suggestion' 
                                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" 
                                            : "border-border-main bg-bg-main text-text-muted hover:bg-bg-hover hover:text-text-main"
                                    }`}
                                >
                                    <Lightbulb className="w-5 h-5 mb-1" />
                                    <span className="text-xs font-medium">Idea</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('bug')}
                                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all ${
                                        type === 'bug' 
                                            ? "border-red-500 bg-red-500/10 text-red-500" 
                                            : "border-border-main bg-bg-main text-text-muted hover:bg-bg-hover hover:text-text-main"
                                    }`}
                                >
                                    <Bug className="w-5 h-5 mb-1" />
                                    <span className="text-xs font-medium">Bug</span>
                                </button>
                            </div>
                        </div>

                        {/* Identidad */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-text-main">Contactar por</label>
                            <div className="flex bg-bg-main p-1 rounded-lg border border-border-main">
                                <button
                                    type="button"
                                    onClick={() => setIdentity('twitch')}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                                        identity === 'twitch' ? "bg-bg-surface text-brand-main shadow-sm" : "text-text-muted hover:text-text-main"
                                    }`}
                                >
                                    Twitch
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIdentity('discord')}
                                    title="Requiere tener Discord vinculado"
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                                        identity === 'discord' ? "bg-[#5865F2]/10 text-[#5865F2] shadow-sm" : "text-text-muted hover:text-text-main"
                                    }`}
                                >
                                    Discord
                                </button>
                            </div>
                            
                            {/* Input extra si elige Twitch para no usar email */}
                            {identity === 'twitch' && (
                                <div className="animate-in slide-in-from-top-1 fade-in duration-200">
                                    <input
                                        type="text"
                                        placeholder="Tu usuario de Discord (Opcional)"
                                        value={discordUsername}
                                        onChange={(e) => setDiscordUsername(e.target.value)}
                                        className="w-full bg-bg-main border border-border-main rounded-xl px-4 py-2.5 text-sm text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-brand-main focus:ring-1 focus:ring-brand-main transition-shadow"
                                    />
                                    <p className="text-[11px] text-text-muted mt-1.5 ml-1">
                                        Si quieres que te respondamos, déjanos tu usuario de Discord.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Mensaje */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-main">Mensaje</label>
                            <textarea
                                required
                                minLength={5}
                                maxLength={2000}
                                placeholder="Cuéntanos qué tienes en mente..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full bg-bg-main border border-border-main rounded-xl px-4 py-3 text-sm text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-brand-main focus:ring-1 focus:ring-brand-main transition-shadow min-h-[120px] resize-none"
                            />
                        </div>

                        {status === 'error' && (
                            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-3 py-2 rounded-lg text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={status === 'loading' || !message.trim()}
                                className="w-full flex items-center justify-center gap-2 bg-brand-main text-white font-medium py-2.5 rounded-xl hover:bg-brand-hover active:bg-brand-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {status === 'loading' ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Enviando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>Enviar Feedback</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
