import { Shield, Info, Key, EyeOff, Eye, Check, RotateCw, AlertTriangle, Gauge, Copy, Clock, Crown } from 'lucide-react';

import { useState } from 'react';
import { SlotText } from 'slot-text/react';
import { card, fadeIn } from '@/core/ui/tw';

interface ProfileSecuritySectionProps {
    apiKey: string;
    keyVisible: boolean;
    showDanger: boolean;
    userId?: string;
    rateLimit: number;
    cacheTtl: number;
    roleLabel: string;
    hasCustomRateLimit?: boolean;
    hasCustomCacheTtl?: boolean;
    onToggleKey: () => void;
    onCopyKey: () => void;
    onRegenKey: () => void;
    onToggleDanger: () => void;
    onCopyId: () => void;
}

const cardShell = `${card} ${fadeIn} mb-3 opacity-0`;

export function ProfileSecuritySection({
    apiKey,
    keyVisible,
    showDanger,
    userId,
    rateLimit,
    cacheTtl,
    roleLabel,
    hasCustomRateLimit,
    hasCustomCacheTtl,
    onToggleKey,
    onCopyKey,
    onRegenKey,
    onToggleDanger,
    onCopyId
}: ProfileSecuritySectionProps) {
    const [isKeyCopied, setIsKeyCopied] = useState(false);
    
    const handleCopyKey = () => {
        onCopyKey();
        setIsKeyCopied(true);
        setTimeout(() => setIsKeyCopied(false), 2000);
    };

    return (
        <div className={`${cardShell} [animation-delay:60ms]`}>
            <div className="mb-2 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2">
                <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-[0.9rem] text-primary">
                        <Shield className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="mb-0.5 text-[0.95rem] font-bold">Seguridad y Conexión</h3>
                        <p className="text-[0.8rem] text-[#c4c4cc]">
                            Gestiona tus credenciales privadas de LosPerris API
                        </p>
                    </div>
                </div>
                <div className="group/tooltip relative flex cursor-help items-center text-[#71717a] transition hover:text-primary">
                    <Info className="w-4 h-4" />
                    <span className="pointer-events-none absolute bottom-[calc(100%+12px)] right-0 z-[100] w-max max-w-[220px] translate-y-2.5 rounded-lg border border-white/[0.08] bg-bg-tertiary px-4 py-2.5 text-left text-[0.8rem] font-semibold leading-snug text-[#fafafa] opacity-0 shadow-lg transition group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100">
                        Mantén esta información privada. No la compartas nunca en directo.
                    </span>
                </div>
            </div>

            <form className="text-[#fafafa]" onSubmit={(e) => e.preventDefault()} autoComplete="off">
                <div className="relative mt-1 overflow-hidden rounded-xl border border-primary/15 bg-black/25 p-3 pl-4 backdrop-blur-[10px] before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-primary before:to-transparent before:opacity-60">
                    <label
                        htmlFor="profile-api-key"
                        className="mb-3 flex items-center text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-primary opacity-90"
                    >
                        <Key className="mr-1" />
                        <span>TU API KEY PRIVADA</span>
                    </label>

                    <div className="flex overflow-hidden rounded-xl border border-white/[0.08] bg-black/20 transition focus-within:border-primary focus-within:bg-black/30">
                        <input
                            id="profile-api-key"
                            readOnly
                            type={keyVisible ? 'text' : 'password'}
                            value={apiKey}
                            autoComplete="new-password"
                            className="flex-1 border-none bg-transparent px-3 py-2 font-[Consolas,monospace] text-[0.9rem] text-white outline-none"
                        />
                        <div className="flex border-l border-white/[0.08] bg-white/[0.02]">
                            <button
                                type="button"
                                onClick={onToggleKey}
                                className="flex items-center justify-center border-l border-white/[0.05] px-3 text-[0.85rem] text-[#c4c4cc] transition first:border-l-0 hover:bg-white/[0.05] hover:text-white"
                                title="Ver/Ocultar"
                            >
                                {keyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                                type="button"
                                onClick={handleCopyKey}
                                className="flex items-center justify-center gap-1.5 border-l border-white/[0.05] px-3 text-[0.85rem] text-[#c4c4cc] transition hover:bg-primary/10 hover:text-primary"
                                title="Copiar"
                            >
                                {isKeyCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                <SlotText text={isKeyCopied ? "Copiado" : "Copiar"} />
                            </button>
                            <button
                                type="button"
                                onClick={onRegenKey}
                                className="flex items-center justify-center border-l border-white/[0.05] px-3 text-[0.85rem] text-[#c4c4cc] transition hover:bg-error/[0.08] hover:text-error"
                                title="Regenerar"
                            >
                                <RotateCw className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={onToggleDanger}
                                className={`flex items-center justify-center border-l border-white/[0.05] px-3 text-[0.85rem] transition hover:bg-error/[0.08] hover:text-error ${
                                    showDanger
                                        ? 'bg-error text-white hover:bg-error-hover hover:text-white'
                                        : 'text-[#c4c4cc]'
                                }`}
                                title={showDanger ? 'Ocultar Zona de Peligro' : 'Mostrar Zona de Peligro'}
                            >
                                <AlertTriangle className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2.5">
                        <div className="flex items-center gap-1.5 rounded-lg border border-[#10b981]/10 bg-[#10b981]/[0.03] px-2.5 py-1 backdrop-blur-[8px]">
                            <span className="text-[0.6rem] font-bold uppercase tracking-[0.05em] text-[#c4c4cc]">
                                ESTADO:
                            </span>
                            <span className="flex items-center text-[0.8rem] font-semibold text-[#10b981]"><Check className="w-3.5 h-3.5 mr-1" />ACTIVA</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg border border-[#3b82f6]/10 bg-[#3b82f6]/[0.03] px-2.5 py-1 backdrop-blur-[8px]">
                            <span className="text-[0.6rem] font-bold uppercase tracking-[0.05em] text-[#c4c4cc]">
                                ACCESO:
                            </span>
                            <span className="text-[0.8rem] font-semibold text-[#3b82f6]">FULL API</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg border border-violet-500/10 bg-violet-500/[0.03] px-2.5 py-1 backdrop-blur-[8px]">
                            <span className="text-[0.6rem] font-bold uppercase tracking-[0.05em] text-[#c4c4cc]">
                                ROL:
                            </span>
                            <span className="text-[0.8rem] font-semibold text-violet-300">{roleLabel}</span>
                            <Crown className="w-3.5 h-3.5 ml-1 text-violet-400 opacity-70" />
                        </div>
                        <div
                            className="flex items-center gap-1.5 rounded-lg border border-white/[0.05] bg-black/20 px-2.5 py-1 backdrop-blur-[8px]"
                            title="Peticiones máximas por minuto con tu API Key"
                        >
                            <span className="text-[0.6rem] font-bold uppercase tracking-[0.05em] text-[#c4c4cc]">
                                LÍMITE/MIN:
                            </span>
                            <span className="text-[0.8rem] font-semibold text-white">
                                {rateLimit} req/min{hasCustomRateLimit ? ' *' : ''}
                            </span>
                            <Gauge className="w-3.5 h-3.5 ml-1 text-primary opacity-70" />
                        </div>
                        <div
                            className="flex items-center gap-1.5 rounded-lg border border-white/[0.05] bg-black/20 px-2.5 py-1 backdrop-blur-[8px]"
                            title="Tiempo que se guardan en caché las respuestas de tu API Key"
                        >
                            <span className="text-[0.6rem] font-bold uppercase tracking-[0.05em] text-[#c4c4cc]">
                                CACHÉ:
                            </span>
                            <span className="text-[0.8rem] font-semibold text-white">
                                {cacheTtl}s{hasCustomCacheTtl ? ' *' : ''}
                            </span>
                            <Clock className="w-3.5 h-3.5 ml-1 text-primary opacity-70" />
                        </div>
                        <button
                            type="button"
                            onClick={onCopyId}
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/[0.05] bg-black/20 px-2.5 py-1 text-left font-[inherit] text-inherit backdrop-blur-[8px] transition hover:border-primary/25 hover:bg-primary/[0.08] hover:[&_.s-value]:text-primary"
                            title="Copiar ID de cuenta"
                        >
                            <span className="text-[0.6rem] font-bold uppercase tracking-[0.05em] text-[#c4c4cc]">
                                ID:
                            </span>
                            <span className="s-value text-[0.8rem] font-semibold text-white">{userId ?? '---'}</span>
                            <Copy className="w-3.5 h-3.5 ml-1 opacity-50" />
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
