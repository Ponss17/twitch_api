import { Shield, Key, EyeOff, Eye, Check, RotateCw, AlertTriangle, Gauge, Copy, Clock, Crown, Info } from 'lucide-react';
import { useState } from 'react';
import { SlotText } from 'slot-text/react';
import { card, fadeIn } from '@/core/utils/tw';

interface SettingsSecuritySectionProps {
    apiKey: string;
    keyVisible: boolean;
    keyLoading?: boolean;
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

export function SettingsSecuritySection({
    apiKey,
    keyVisible,
    keyLoading = false,
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
}: SettingsSecuritySectionProps) {
    const [isKeyCopied, setIsKeyCopied] = useState(false);

    const handleCopyKey = () => {
        onCopyKey();
        setIsKeyCopied(true);
        setTimeout(() => setIsKeyCopied(false), 2000);
    };

    return (
        <div className={`${cardShell} [animation-delay:60ms]`}>
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2">
                <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                        <Shield className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="mb-0.5 text-[0.95rem] font-bold">Seguridad y Conexión</h3>
                        <p className="text-[0.8rem] text-[#c4c4cc]">Gestiona tus credenciales privadas de LosPerris API</p>
                    </div>
                </div>
                <div className="group/tooltip relative flex cursor-help items-center text-zinc-500 transition hover:text-primary">
                    <Info className="w-4 h-4" />
                    <span className="pointer-events-none absolute bottom-[calc(100%+10px)] right-0 z-[100] w-max max-w-[210px] translate-y-2 rounded-lg border border-white/[0.08] bg-bg-tertiary px-3 py-2 text-left text-[0.78rem] font-semibold leading-snug text-[#fafafa] opacity-0 shadow-lg transition group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100">
                        Mantén esta información privada. No la compartas en directo.
                    </span>
                </div>
            </div>

            <div className="relative mb-3 overflow-hidden rounded-xl border border-white/[0.08] bg-black/40 p-3 px-4">
                <label htmlFor="profile-api-key" className="mb-2 flex items-center text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-primary opacity-90">
                    <Key className="mr-1 w-3 h-3" />
                    Tu API Key privada
                </label>
                <div className="flex overflow-hidden rounded-lg border border-white/[0.08] bg-black/20 transition focus-within:border-primary">
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
                            disabled={keyLoading}
                            title="Ver/Ocultar"
                            aria-label={keyVisible ? 'Ocultar API Key' : 'Mostrar API Key'}
                            className="flex items-center justify-center border-l border-white/[0.05] px-3 text-zinc-400 transition first:border-l-0 hover:bg-white/[0.05] hover:text-white"
                        >
                            {keyVisible ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                        </button>
                        <button
                            type="button"
                            onClick={handleCopyKey}
                            disabled={keyLoading}
                            title="Copiar"
                            aria-label={isKeyCopied ? 'API Key copiada' : 'Copiar API Key'}
                            className="flex items-center justify-center gap-1.5 border-l border-white/[0.05] px-3 text-[0.82rem] text-zinc-400 transition hover:bg-primary/10 hover:text-primary"
                        >
                            {isKeyCopied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                            <SlotText text={isKeyCopied ? 'Copiado' : 'Copiar'} />
                        </button>
                        <button
                            type="button"
                            onClick={onRegenKey}
                            title="Regenerar"
                            aria-label="Regenerar API Key"
                            className="flex items-center justify-center border-l border-white/[0.05] px-3 text-zinc-400 transition hover:bg-error/[0.08] hover:text-error"
                        >
                            <RotateCw className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            onClick={onToggleDanger}
                            title={showDanger ? 'Ocultar Zona de Peligro' : 'Mostrar Zona de Peligro'}
                            aria-label={showDanger ? 'Ocultar Zona de Peligro' : 'Mostrar Zona de Peligro'}
                            aria-expanded={showDanger}
                            className={`flex items-center justify-center border-l border-white/[0.05] px-3 text-[0.85rem] transition hover:bg-error/[0.08] hover:text-error ${showDanger ? 'bg-error text-white hover:bg-error hover:text-white' : 'text-zinc-400'}`}
                        >
                            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/[0.06] px-2 py-1 text-[0.72rem] font-bold text-emerald-400">
                    <Check className="w-3 h-3" /> Activa
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-violet-500/20 bg-violet-500/[0.06] px-2 py-1 text-[0.72rem] font-bold text-violet-300">
                    <Crown className="w-3 h-3 opacity-70" /> {roleLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[0.72rem] font-bold text-zinc-300">
                    <Gauge className="w-3 h-3 text-primary opacity-70" /> {rateLimit} req/min{hasCustomRateLimit ? ' *' : ''}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[0.72rem] font-bold text-zinc-300">
                    <Clock className="w-3 h-3 text-primary opacity-70" /> {cacheTtl}s{hasCustomCacheTtl ? ' *' : ''}
                </span>
                <button type="button" onClick={onCopyId}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[0.72rem] font-bold text-zinc-300 transition hover:border-primary/30 hover:text-primary font-[inherit]">
                    <Copy className="w-3 h-3 opacity-50" /> {userId ?? '---'}
                </button>
            </div>
        </div>
    );
}
