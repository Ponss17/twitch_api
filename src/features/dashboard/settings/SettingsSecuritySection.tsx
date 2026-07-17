import { Key, EyeOff, Eye, Check, RotateCw, AlertTriangle, Gauge, Copy, Clock, Crown } from 'lucide-react';
import { useState } from 'react';
import { SettingsRow } from '@/features/dashboard/settings/SettingsGroup';

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
        <SettingsRow
            title="API Key privada"
            icon={Key}
            info="Mantén esta información privada. No la compartas en directo."
            description="Tu credencial para autenticar peticiones a la API. Mantenla en secreto."
        >
            <div className="flex overflow-hidden rounded-lg border border-white/[0.06] bg-bg-secondary transition focus-within:border-primary">
                <input
                    id="profile-api-key"
                    readOnly
                    type={keyVisible ? 'text' : 'password'}
                    value={apiKey}
                    autoComplete="new-password"
                    aria-label="API Key privada"
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
                        {isKeyCopied ? 'Copiado' : 'Copiar'}
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

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/[0.08] px-2 py-0.5 text-[0.7rem] font-semibold text-emerald-400">
                    <Check className="w-3 h-3" /> Activa
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[0.7rem] font-semibold text-primary">
                    <Crown className="w-3 h-3 opacity-80" /> {roleLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-[0.7rem] font-semibold text-zinc-400">
                    <Gauge className="w-3 h-3 text-primary/70" /> {rateLimit} req/min{hasCustomRateLimit ? ' *' : ''}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-[0.7rem] font-semibold text-zinc-400">
                    <Clock className="w-3 h-3 text-primary/70" /> {cacheTtl}s{hasCustomCacheTtl ? ' *' : ''}
                </span>
                <button type="button" onClick={onCopyId}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-[0.7rem] font-semibold text-zinc-400 transition hover:text-primary font-[inherit]">
                    <Copy className="w-3 h-3 text-primary/60" /> {userId ?? '---'}
                </button>
            </div>
        </SettingsRow>
    );
}
