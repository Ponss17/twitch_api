import { Key, EyeOff, Eye, Check, RotateCw, Copy } from 'lucide-react';
import { useState } from 'react';
import { SettingsRow } from '@/features/dashboard/settings/SettingsGroup';

interface SettingsSecuritySectionProps {
    apiKey: string;
    keyVisible: boolean;
    keyLoading?: boolean;
    onToggleKey: () => void;
    onCopyKey: () => void;
    onRegenKey: () => void;
}

export function SettingsSecuritySection({
    apiKey,
    keyVisible,
    keyLoading = false,
    onToggleKey,
    onCopyKey,
    onRegenKey
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
                        {keyVisible ? (
                            <EyeOff className="w-4 h-4" aria-hidden="true" />
                        ) : (
                            <Eye className="w-4 h-4" aria-hidden="true" />
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={handleCopyKey}
                        disabled={keyLoading}
                        title="Copiar"
                        aria-label={isKeyCopied ? 'API Key copiada' : 'Copiar API Key'}
                        className="flex items-center justify-center gap-1.5 border-l border-white/[0.05] px-3 text-[0.82rem] text-zinc-400 transition hover:bg-primary/10 hover:text-primary"
                    >
                        {isKeyCopied ? (
                            <Check className="w-4 h-4" aria-hidden="true" />
                        ) : (
                            <Copy className="w-4 h-4" aria-hidden="true" />
                        )}
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
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/15 bg-emerald-500/[0.06] px-2.5 py-1 text-[0.75rem] font-medium text-emerald-400">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    </span>
                    API Key Activa
                </span>
                <span className="text-[0.75rem] text-zinc-400">
                    Lista para autenticar peticiones (Bearer).
                </span>
            </div>
        </SettingsRow>
    );
}
