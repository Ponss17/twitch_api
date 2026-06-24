import { useEffect, useState } from 'react';
import { SlotText } from 'slot-text/react';
import { BaseModal } from '@/components/ui/Modal';
import type { ChatLogItem } from '@/lib/chatLogStore';
import { chatLogStore } from '@/lib/chatLogStore';
import { calculateAccountAge, broadcasterLabel, type TwitchUser } from '@/lib/twitchTypes';
import { formatDate } from '@/lib/utils';
import { staticPath } from '@/lib/paths';
import { X, Check } from 'lucide-react';


interface UserInspectModalProps {
    user: TwitchUser | null;
    onClose: () => void;
    showLogs?: boolean;
}

export function UserInspectModal({ user, onClose, showLogs = true }: UserInspectModalProps) {
    const [logs, setLogs] = useState<ChatLogItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isIdCopied, setIsIdCopied] = useState(false);

    const copyUserId = async () => {
        if (!user) return;
        await navigator.clipboard.writeText(user.id);
        setIsIdCopied(true);
        setTimeout(() => setIsIdCopied(false), 2000);
    };



    if (!user) return null;

    const rankLabel = broadcasterLabel(user.broadcaster_type);
    const rankColor =
        user.broadcaster_type === 'partner' || user.broadcaster_type === 'affiliate'
            ? '#9146ff'
            : '#a1a1aa';

    const loadLogs = () => {
        setLogs(chatLogStore.getByUser(user.login));
        setShowHistory(true);
    };

    return (
        <BaseModal
            open={!!user}
            onClose={onClose}
            className="relative my-auto max-h-[min(90vh,720px)] w-full max-w-[450px] overflow-y-auto rounded-[20px] border border-white/[0.08] bg-bg-card shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
        >
            <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="absolute top-[15px] right-[15px] z-10 flex h-8 w-8 items-center justify-center rounded-full border-none bg-white/5 text-[1.2rem] text-white transition hover:rotate-90 hover:bg-error"
            >
                <X />
            </button>

            <div className="flex items-center gap-5 border-b border-white/[0.08] bg-gradient-to-r from-white/[0.03] to-transparent p-6 max-md:flex-col max-md:text-center">
                <img
                    src={user.profile_image_url ?? staticPath('/img/logo.svg')}
                    alt={user.display_name}
                    loading="lazy"
                    className="h-20 w-20 shrink-0 rounded-full border-[3px] border-bg-card object-cover shadow-[0_0_20px_rgba(145,70,255,0.2)]"
                />
                <div className="flex flex-col gap-1">
                    <h2
                        id="user-inspect-title"
                        className="m-0 text-[1.4rem] leading-tight font-bold text-[#fafafa]"
                    >
                        {user.display_name}
                    </h2>
                    <p className="m-0 text-[0.9rem] font-medium text-primary">@{user.login}</p>
                </div>
            </div>

            <div className="p-6">
                <div className="mb-5 grid grid-cols-2 gap-4 rounded-xl border border-white/[0.08] bg-bg-card p-4 max-md:grid-cols-1">
                    <div className="flex flex-col gap-1 text-left">
                        <span className="text-[0.65rem] tracking-wide text-[#71717a] uppercase">Rango</span>
                        <span className="font-[Consolas,monospace] text-[0.85rem] font-medium" style={{ color: rankColor }}>
                            {rankLabel}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1 text-left">
                        <span className="text-[0.65rem] tracking-wide text-[#71717a] uppercase">ID Usuario</span>
                        <button
                            type="button"
                            onClick={() => void copyUserId()}
                            className="flex items-center justify-start gap-1.5 font-[Consolas,monospace] text-[0.85rem] font-medium text-[#a1a1aa] transition hover:text-[#fafafa]"
                            title="Copiar ID"
                        >
                            {user.id}
                            <Check className={` ${isIdCopied ? ' text-primary' : 'fa-copy'}`} />
                            <SlotText text={isIdCopied ? 'Copiado' : ''} />
                        </button>
                    </div>
                    <div className="flex flex-col gap-1 text-left">
                        <span className="text-[0.65rem] tracking-wide text-[#71717a] uppercase">Antigüedad</span>
                        <span className="font-[Consolas,monospace] text-[0.85rem] font-medium text-[#a1a1aa]">
                            {calculateAccountAge(user.created_at)}
                        </span>
                    </div>
                </div>

                {!showHistory ? (
                    <p className="mx-auto my-2.5 px-2.5 text-center text-[0.95rem] leading-relaxed text-[#a1a1aa]">
                        {user.description || 'Sin biografía.'}
                    </p>
                ) : (
                    <div className="mt-5 border-t border-white/[0.08] pt-4">
                        <h4 className="mb-2.5 text-[0.95rem] font-semibold text-[#fafafa]">
                            Historial del chat
                        </h4>
                        {logs.length === 0 ? (
                            <p className="py-5 text-center text-[0.85rem] text-[#71717a] italic">
                                Sin mensajes registrados en esta sesión.
                            </p>
                        ) : (
                            <div className="flex max-h-[200px] flex-col gap-2 overflow-y-auto">
                                {logs.map((l, i) => (
                                    <div
                                        key={`${l.time.getTime()}-${i}`}
                                        className="flex gap-2.5 rounded bg-white/[0.03] p-1.5 text-[0.85rem]"
                                    >
                                        <span className="shrink-0 font-[Consolas,monospace] text-[0.8rem] whitespace-nowrap text-[#71717a]">
                                            [{l.time.toLocaleTimeString()}]
                                        </span>
                                        <span className="break-words text-[#a1a1aa]">{l.text}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-4 rounded-b-[20px] border-t border-white/[0.08] bg-black/20 pt-5">
                    <p className="mb-4 text-center text-[0.85rem] text-[#71717a]">
                        Cuenta creada: {formatDate(user.created_at ?? '')}
                    </p>
                    {showLogs && !showHistory && (
                        <button
                            type="button"
                            onClick={loadLogs}
                            className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-[0.8125rem] font-semibold text-[#fafafa] transition hover:border-white/30 hover:bg-white/15"
                        >
                            Ver historial del chat
                        </button>
                    )}
                </div>
            </div>
        </BaseModal>
    );
}
